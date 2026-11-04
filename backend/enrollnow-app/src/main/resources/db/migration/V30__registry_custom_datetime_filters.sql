SET search_path TO enrollnow, public;

CREATE OR REPLACE FUNCTION registry_parse_custom_variable_datetime(
    input_value TEXT,
    variable_type TEXT
)
RETURNS TIMESTAMP WITHOUT TIME ZONE
LANGUAGE plpgsql
STABLE
SET TimeZone = 'UTC'
AS $$
DECLARE
    normalized_value TEXT := btrim(input_value);
BEGIN
    IF normalized_value IS NULL OR normalized_value = '' THEN
        RETURN NULL;
    END IF;

    IF normalized_value ~ '^\d{4}-\d{2}-\d{2}$' THEN
        RETURN normalized_value::DATE::TIMESTAMP;
    END IF;

    IF normalized_value ~ '^\d{4}-\d{2}-\d{2}[T ]' THEN
        IF normalized_value ~ '(Z|[+-]\d{2}:\d{2})$' THEN
            RETURN normalized_value::TIMESTAMPTZ AT TIME ZONE 'UTC';
        END IF;
        RETURN normalized_value::TIMESTAMP;
    END IF;

    IF normalized_value ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        RETURN to_date(normalized_value, 'MM/DD/YYYY')::TIMESTAMP;
    END IF;

    IF normalized_value ~ '^\d{1,2}/\d{1,2}/\d{4}[,\s]+\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)$' THEN
        normalized_value := regexp_replace(normalized_value, ',', '', 'g');
        IF normalized_value ~ ':\d{2}:\d{2}\s*(AM|PM)$' THEN
            RETURN to_timestamp(normalized_value, 'MM/DD/YYYY HH12:MI:SS AM')::TIMESTAMP;
        END IF;
        RETURN to_timestamp(normalized_value, 'MM/DD/YYYY HH12:MI AM')::TIMESTAMP;
    END IF;

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION registry_custom_variable_date_matches(
    attributes JSONB,
    variable_key TEXT,
    variable_type TEXT,
    filter_operator TEXT,
    filter_value TEXT,
    minimum_value TEXT,
    maximum_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET TimeZone = 'UTC'
AS $$
DECLARE
    stored_value TEXT;
    actual_value TIMESTAMP WITHOUT TIME ZONE;
    target_value TIMESTAMP WITHOUT TIME ZONE;
    minimum_date TIMESTAMP WITHOUT TIME ZONE;
    maximum_date TIMESTAMP WITHOUT TIME ZONE;
    normalized_type TEXT := lower(variable_type);
    normalized_operator TEXT := lower(filter_operator);
    actual_day DATE;
    target_day DATE;
BEGIN
    SELECT item->>'value'
    INTO stored_value
    FROM jsonb_array_elements(
        CASE
            WHEN jsonb_typeof(attributes->'variables') = 'array' THEN attributes->'variables'
            ELSE '[]'::JSONB
        END
    ) AS variables(item)
    WHERE item->>'id' = variable_key
       OR lower(item->>'name') = lower(variable_key)
    LIMIT 1;

    IF stored_value IS NULL THEN
        RETURN normalized_operator = 'not_equal';
    END IF;

    actual_value := enrollnow.registry_parse_custom_variable_datetime(stored_value, normalized_type);
    IF actual_value IS NULL THEN
        RETURN normalized_operator = 'not_equal';
    END IF;

    IF normalized_operator IN ('between', 'not_between') THEN
        minimum_date := enrollnow.registry_parse_custom_variable_datetime(minimum_value, normalized_type);
        maximum_date := enrollnow.registry_parse_custom_variable_datetime(maximum_value, normalized_type);
        IF minimum_date IS NULL OR maximum_date IS NULL THEN
            RETURN FALSE;
        END IF;

        IF normalized_type = 'date' THEN
            actual_day := actual_value::DATE;
            target_day := minimum_date::DATE;
            IF normalized_operator = 'between' THEN
                RETURN actual_day >= target_day AND actual_day <= maximum_date::DATE;
            END IF;
            RETURN actual_day < target_day OR actual_day > maximum_date::DATE;
        END IF;

        IF normalized_operator = 'between' THEN
            RETURN actual_value >= minimum_date AND actual_value <= maximum_date;
        END IF;
        RETURN actual_value < minimum_date OR actual_value > maximum_date;
    END IF;

    target_value := enrollnow.registry_parse_custom_variable_datetime(filter_value, normalized_type);
    IF target_value IS NULL THEN
        RETURN FALSE;
    END IF;

    IF normalized_type = 'date' THEN
        actual_day := actual_value::DATE;
        target_day := target_value::DATE;
        CASE normalized_operator
            WHEN 'equal' THEN RETURN actual_day = target_day;
            WHEN 'not_equal' THEN RETURN actual_day <> target_day;
            WHEN 'greater_than' THEN RETURN actual_day >= target_day;
            WHEN 'less_than' THEN RETURN actual_day <= target_day;
            ELSE RETURN FALSE;
        END CASE;
    END IF;

    CASE normalized_operator
        WHEN 'equal' THEN
            RETURN actual_value >= date_trunc('minute', target_value)
               AND actual_value < date_trunc('minute', target_value) + INTERVAL '1 minute';
        WHEN 'not_equal' THEN
            RETURN actual_value < date_trunc('minute', target_value)
                OR actual_value >= date_trunc('minute', target_value) + INTERVAL '1 minute';
        WHEN 'greater_than' THEN
            RETURN actual_value >= date_trunc('minute', target_value);
        WHEN 'less_than' THEN
            RETURN actual_value <= date_trunc('minute', target_value) + INTERVAL '1 minute';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;
