--
-- PostgreSQL database dump
--

\restrict FH8aM2rzQdTxCyQ1JjGrGPwoUFKi7QQlFQCcQIxQTGqZFwKQ6cP0Cxfs92QsKNa

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-10-19 19:12:08

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 7 (class 2615 OID 29361)
-- Name: enrollnow; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA enrollnow;


ALTER SCHEMA enrollnow OWNER TO postgres;

--
-- TOC entry 2 (class 3079 OID 29379)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA enrollnow;


--
-- TOC entry 6327 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 325 (class 1255 OID 31627)
-- Name: prevent_audit_record_modification(); Type: FUNCTION; Schema: enrollnow; Owner: postgres
--

CREATE FUNCTION enrollnow.prevent_audit_record_modification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION
        'Audit/history records are append-only and cannot be updated or deleted';
END;
$$;


ALTER FUNCTION enrollnow.prevent_audit_record_modification() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 281 (class 1259 OID 31561)
-- Name: audit_events; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.audit_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    actor_user_id uuid,
    entity_type character varying(100) NOT NULL,
    entity_id uuid,
    action character varying(100) NOT NULL,
    description character varying(1000),
    source character varying(50) DEFAULT 'APPLICATION'::character varying NOT NULL,
    correlation_id uuid,
    request_id character varying(255),
    before_data jsonb,
    after_data jsonb,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.audit_events OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 31199)
-- Name: calendar_event_attendees; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.calendar_event_attendees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    calendar_event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    attendee_role character varying(30) DEFAULT 'ATTENDEE'::character varying NOT NULL,
    response_status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_calendar_event_attendees_response CHECK (((response_status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACCEPTED'::character varying, 'DECLINED'::character varying, 'TENTATIVE'::character varying])::text[]))),
    CONSTRAINT ck_calendar_event_attendees_role CHECK (((attendee_role)::text = ANY ((ARRAY['ORGANIZER'::character varying, 'ATTENDEE'::character varying])::text[])))
);


ALTER TABLE enrollnow.calendar_event_attendees OWNER TO postgres;

--
-- TOC entry 272 (class 1259 OID 31139)
-- Name: calendar_events; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid,
    participant_id uuid,
    candidate_id uuid,
    enrollment_id uuid,
    title character varying(255) NOT NULL,
    description text,
    event_type character varying(50),
    location character varying(500),
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    all_day boolean DEFAULT false NOT NULL,
    status character varying(30) DEFAULT 'SCHEDULED'::character varying NOT NULL,
    created_by_user_id uuid,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_calendar_events_dates CHECK ((end_at >= start_at)),
    CONSTRAINT ck_calendar_events_status CHECK (((status)::text = ANY ((ARRAY['SCHEDULED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE enrollnow.calendar_events OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 30347)
-- Name: candidate_status_history; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.candidate_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    previous_status character varying(30),
    new_status character varying(30) NOT NULL,
    reason character varying(500),
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    changed_by uuid,
    CONSTRAINT ck_candidate_status_history_new CHECK (((new_status)::text = ANY ((ARRAY['REFERRED'::character varying, 'CONTACTED'::character varying, 'SCREENING'::character varying, 'QUALIFIED'::character varying, 'DISQUALIFIED'::character varying, 'WITHDRAWN'::character varying])::text[]))),
    CONSTRAINT ck_candidate_status_history_previous CHECK (((previous_status IS NULL) OR ((previous_status)::text = ANY ((ARRAY['REFERRED'::character varying, 'CONTACTED'::character varying, 'SCREENING'::character varying, 'QUALIFIED'::character varying, 'DISQUALIFIED'::character varying, 'WITHDRAWN'::character varying])::text[]))))
);


ALTER TABLE enrollnow.candidate_status_history OWNER TO postgres;

--
-- TOC entry 277 (class 1259 OID 31380)
-- Name: communication_delivery_events; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.communication_delivery_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    communication_id uuid NOT NULL,
    recipient_id uuid,
    event_type character varying(50) NOT NULL,
    event_at timestamp with time zone DEFAULT now() NOT NULL,
    provider character varying(100),
    provider_event_id character varying(255),
    error_code character varying(100),
    error_message text,
    provider_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.communication_delivery_events OWNER TO postgres;

--
-- TOC entry 276 (class 1259 OID 31340)
-- Name: communication_recipients; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.communication_recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    communication_id uuid NOT NULL,
    participant_id uuid,
    recipient_type character varying(30) DEFAULT 'TO'::character varying NOT NULL,
    recipient_name character varying(255),
    recipient_value character varying(500) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_communication_recipient_type CHECK (((recipient_type)::text = ANY ((ARRAY['TO'::character varying, 'CC'::character varying, 'BCC'::character varying, 'PHONE'::character varying, 'OTHER'::character varying])::text[])))
);


ALTER TABLE enrollnow.communication_recipients OWNER TO postgres;

--
-- TOC entry 274 (class 1259 OID 31239)
-- Name: communication_templates; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.communication_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    channel character varying(30) NOT NULL,
    subject_template character varying(500),
    body_template text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_communication_templates_channel CHECK (((channel)::text = ANY ((ARRAY['EMAIL'::character varying, 'SMS'::character varying, 'PHONE'::character varying, 'OTHER'::character varying])::text[])))
);


ALTER TABLE enrollnow.communication_templates OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 31275)
-- Name: communications; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.communications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid,
    participant_id uuid,
    candidate_id uuid,
    enrollment_id uuid,
    template_id uuid,
    channel character varying(30) NOT NULL,
    direction character varying(20) DEFAULT 'OUTBOUND'::character varying NOT NULL,
    subject_snapshot character varying(500),
    body_snapshot text,
    status character varying(30) DEFAULT 'CREATED'::character varying NOT NULL,
    initiated_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    completed_at timestamp with time zone,
    external_message_id character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT ck_communications_channel CHECK (((channel)::text = ANY ((ARRAY['EMAIL'::character varying, 'SMS'::character varying, 'PHONE'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT ck_communications_dates CHECK ((((sent_at IS NULL) OR (sent_at >= created_at)) AND ((completed_at IS NULL) OR (completed_at >= created_at)))),
    CONSTRAINT ck_communications_direction CHECK (((direction)::text = ANY ((ARRAY['OUTBOUND'::character varying, 'INBOUND'::character varying])::text[]))),
    CONSTRAINT ck_communications_status CHECK (((status)::text = ANY ((ARRAY['CREATED'::character varying, 'QUEUED'::character varying, 'SENT'::character varying, 'DELIVERED'::character varying, 'FAILED'::character varying, 'BOUNCED'::character varying, 'CANCELLED'::character varying, 'COMPLETED'::character varying])::text[])))
);


ALTER TABLE enrollnow.communications OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 30588)
-- Name: consent_history; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.consent_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    consent_id uuid NOT NULL,
    previous_status character varying(30),
    new_status character varying(30) NOT NULL,
    reason character varying(500),
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    changed_by uuid,
    CONSTRAINT ck_consent_history_new CHECK (((new_status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONSENTED'::character varying, 'DECLINED'::character varying, 'WITHDRAWN'::character varying])::text[]))),
    CONSTRAINT ck_consent_history_previous CHECK (((previous_status IS NULL) OR ((previous_status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONSENTED'::character varying, 'DECLINED'::character varying, 'WITHDRAWN'::character varying])::text[]))))
);


ALTER TABLE enrollnow.consent_history OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 30494)
-- Name: consent_versions; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.consent_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid NOT NULL,
    version_number character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    external_reference character varying(255),
    effective_from timestamp with time zone,
    effective_to timestamp with time zone,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_consent_versions_dates CHECK (((effective_to IS NULL) OR (effective_from IS NULL) OR (effective_to >= effective_from)))
);


ALTER TABLE enrollnow.consent_versions OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 30529)
-- Name: consents; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    candidate_id uuid,
    consent_version_id uuid NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    consented_at timestamp with time zone,
    declined_at timestamp with time zone,
    withdrawn_at timestamp with time zone,
    consented_by_user_id uuid,
    consent_method character varying(30),
    withdrawal_reason character varying(500),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_consents_method CHECK (((consent_method IS NULL) OR ((consent_method)::text = ANY ((ARRAY['ELECTRONIC'::character varying, 'PAPER'::character varying, 'VERBAL'::character varying, 'IMPORTED'::character varying, 'OTHER'::character varying])::text[])))),
    CONSTRAINT ck_consents_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONSENTED'::character varying, 'DECLINED'::character varying, 'WITHDRAWN'::character varying])::text[])))
);


ALTER TABLE enrollnow.consents OWNER TO postgres;

--
-- TOC entry 280 (class 1259 OID 31495)
-- Name: document_links; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.document_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    document_id uuid NOT NULL,
    study_id uuid,
    participant_id uuid,
    candidate_id uuid,
    consent_id uuid,
    enrollment_id uuid,
    communication_id uuid,
    task_id uuid,
    link_type character varying(50),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT ck_document_links_context CHECK (((study_id IS NOT NULL) OR (participant_id IS NOT NULL) OR (candidate_id IS NOT NULL) OR (consent_id IS NOT NULL) OR (enrollment_id IS NOT NULL) OR (communication_id IS NOT NULL) OR (task_id IS NOT NULL)))
);


ALTER TABLE enrollnow.document_links OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 31455)
-- Name: document_versions; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.document_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    document_id uuid NOT NULL,
    version_number integer NOT NULL,
    file_name character varying(255) NOT NULL,
    mime_type character varying(150),
    file_size_bytes bigint,
    storage_provider character varying(50),
    storage_bucket character varying(255),
    storage_key character varying(1000) NOT NULL,
    checksum_algorithm character varying(30) DEFAULT 'SHA-256'::character varying,
    checksum_value character varying(255),
    uploaded_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_document_versions_number CHECK ((version_number > 0)),
    CONSTRAINT ck_document_versions_size CHECK (((file_size_bytes IS NULL) OR (file_size_bytes >= 0)))
);


ALTER TABLE enrollnow.document_versions OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 31418)
-- Name: documents; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    document_type character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_by_user_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_documents_status CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'ARCHIVED'::character varying, 'DELETED'::character varying])::text[])))
);


ALTER TABLE enrollnow.documents OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 30681)
-- Name: enrollment_status_history; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.enrollment_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    previous_status character varying(30),
    new_status character varying(30) NOT NULL,
    reason character varying(500),
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    changed_by uuid,
    CONSTRAINT ck_enrollment_status_history_new CHECK (((new_status)::text = ANY ((ARRAY['ENROLLED'::character varying, 'ACTIVE'::character varying, 'COMPLETED'::character varying, 'WITHDRAWN'::character varying])::text[]))),
    CONSTRAINT ck_enrollment_status_history_previous CHECK (((previous_status IS NULL) OR ((previous_status)::text = ANY ((ARRAY['ENROLLED'::character varying, 'ACTIVE'::character varying, 'COMPLETED'::character varying, 'WITHDRAWN'::character varying])::text[]))))
);


ALTER TABLE enrollnow.enrollment_status_history OWNER TO postgres;

--
-- TOC entry 282 (class 1259 OID 31596)
-- Name: entity_change_history; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.entity_change_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    audit_event_id uuid NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    field_name character varying(255) NOT NULL,
    previous_value jsonb,
    new_value jsonb,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.entity_change_history OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 31708)
-- Name: external_system_links; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.external_system_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    external_system character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    external_identifier character varying(500) NOT NULL,
    external_identifier_type character varying(100),
    source_system character varying(100),
    active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


ALTER TABLE enrollnow.external_system_links OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 29362)
-- Name: flyway_schema_history; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE enrollnow.flyway_schema_history OWNER TO postgres;

--
-- TOC entry 287 (class 1259 OID 31777)
-- Name: integration_event_attempts; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.integration_event_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    integration_event_id uuid NOT NULL,
    attempt_number integer NOT NULL,
    processor character varying(255),
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    status character varying(30) NOT NULL,
    http_status integer,
    error_code character varying(100),
    error_message text,
    response_payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_integration_event_attempt_dates CHECK (((completed_at IS NULL) OR (completed_at >= started_at))),
    CONSTRAINT ck_integration_event_attempt_http_status CHECK (((http_status IS NULL) OR ((http_status >= 100) AND (http_status <= 599)))),
    CONSTRAINT ck_integration_event_attempt_number CHECK ((attempt_number > 0)),
    CONSTRAINT ck_integration_event_attempt_status CHECK (((status)::text = ANY ((ARRAY['STARTED'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE enrollnow.integration_event_attempts OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 31742)
-- Name: integration_events; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.integration_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    external_system character varying(100) NOT NULL,
    direction character varying(20) NOT NULL,
    event_type character varying(150) NOT NULL,
    entity_type character varying(100),
    entity_id uuid,
    external_event_id character varying(500),
    correlation_id uuid,
    request_id character varying(255),
    status character varying(30) DEFAULT 'RECEIVED'::character varying NOT NULL,
    request_payload jsonb,
    response_payload jsonb,
    received_at timestamp with time zone,
    processing_started_at timestamp with time zone,
    completed_at timestamp with time zone,
    failed_at timestamp with time zone,
    retry_count integer DEFAULT 0 NOT NULL,
    last_error_code character varying(100),
    last_error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_integration_events_dates CHECK ((((processing_started_at IS NULL) OR (processing_started_at >= created_at)) AND ((completed_at IS NULL) OR (completed_at >= created_at)) AND ((failed_at IS NULL) OR (failed_at >= created_at)))),
    CONSTRAINT ck_integration_events_direction CHECK (((direction)::text = ANY ((ARRAY['INBOUND'::character varying, 'OUTBOUND'::character varying])::text[]))),
    CONSTRAINT ck_integration_events_retry_count CHECK ((retry_count >= 0)),
    CONSTRAINT ck_integration_events_status CHECK (((status)::text = ANY ((ARRAY['RECEIVED'::character varying, 'PENDING'::character varying, 'PROCESSING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'DEAD_LETTER'::character varying])::text[])))
);


ALTER TABLE enrollnow.integration_events OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 31672)
-- Name: outbox_event_attempts; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.outbox_event_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    outbox_event_id uuid NOT NULL,
    attempt_number integer NOT NULL,
    processor character varying(255),
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    status character varying(30) NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_outbox_event_attempt_dates CHECK (((completed_at IS NULL) OR (completed_at >= started_at))),
    CONSTRAINT ck_outbox_event_attempt_number CHECK ((attempt_number > 0)),
    CONSTRAINT ck_outbox_event_attempt_status CHECK (((status)::text = ANY ((ARRAY['STARTED'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE enrollnow.outbox_event_attempts OWNER TO postgres;

--
-- TOC entry 283 (class 1259 OID 31630)
-- Name: outbox_events; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.outbox_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    aggregate_type character varying(100) NOT NULL,
    aggregate_id uuid NOT NULL,
    event_type character varying(150) NOT NULL,
    event_version integer DEFAULT 1 NOT NULL,
    payload jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    correlation_id uuid,
    causation_id uuid,
    idempotency_key character varying(255),
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    available_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    locked_by character varying(255),
    published_at timestamp with time zone,
    failed_at timestamp with time zone,
    retry_count integer DEFAULT 0 NOT NULL,
    last_error text,
    CONSTRAINT ck_outbox_events_retry_count CHECK ((retry_count >= 0)),
    CONSTRAINT ck_outbox_events_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'PUBLISHED'::character varying, 'FAILED'::character varying, 'DEAD_LETTER'::character varying])::text[]))),
    CONSTRAINT ck_outbox_events_version CHECK ((event_version > 0))
);


ALTER TABLE enrollnow.outbox_events OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 30122)
-- Name: participant_addresses; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.participant_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    address_type character varying(30) DEFAULT 'HOME'::character varying NOT NULL,
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state_region character varying(100),
    postal_code character varying(30),
    country_code character varying(3),
    primary_address boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_participant_address_type CHECK (((address_type)::text = ANY ((ARRAY['HOME'::character varying, 'MAILING'::character varying, 'TEMPORARY'::character varying, 'OTHER'::character varying])::text[])))
);


ALTER TABLE enrollnow.participant_addresses OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 30083)
-- Name: participant_contacts; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.participant_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    contact_type character varying(30) NOT NULL,
    contact_value character varying(320) NOT NULL,
    label character varying(50),
    primary_contact boolean DEFAULT false NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_participant_contact_type CHECK (((contact_type)::text = ANY ((ARRAY['EMAIL'::character varying, 'PHONE'::character varying, 'SMS'::character varying, 'OTHER'::character varying])::text[])))
);


ALTER TABLE enrollnow.participant_contacts OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 30049)
-- Name: participant_identifiers; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.participant_identifiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    identifier_type character varying(50) NOT NULL,
    identifier_value character varying(255) NOT NULL,
    issuing_system character varying(100),
    primary_identifier boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


ALTER TABLE enrollnow.participant_identifiers OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 30158)
-- Name: participant_preferences; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.participant_preferences (
    participant_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    preferred_language character varying(20),
    timezone character varying(100),
    allow_email boolean DEFAULT true NOT NULL,
    allow_sms boolean DEFAULT true NOT NULL,
    allow_phone boolean DEFAULT true NOT NULL,
    do_not_contact boolean DEFAULT false NOT NULL,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


ALTER TABLE enrollnow.participant_preferences OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 30250)
-- Name: participant_referrals; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.participant_referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    source_id uuid,
    study_id uuid,
    referral_date date DEFAULT CURRENT_DATE NOT NULL,
    referrer_name character varying(200),
    referrer_contact character varying(320),
    external_reference character varying(255),
    notes text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


ALTER TABLE enrollnow.participant_referrals OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 30193)
-- Name: participant_status_history; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.participant_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    previous_status character varying(30),
    new_status character varying(30) NOT NULL,
    reason character varying(500),
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    changed_by uuid,
    CONSTRAINT ck_participant_status_history_new CHECK (((new_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'DECEASED'::character varying, 'MERGED'::character varying])::text[]))),
    CONSTRAINT ck_participant_status_history_previous CHECK (((previous_status IS NULL) OR ((previous_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'DECEASED'::character varying, 'MERGED'::character varying])::text[]))))
);


ALTER TABLE enrollnow.participant_status_history OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 30011)
-- Name: participants; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    site_id uuid,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    preferred_name character varying(100),
    date_of_birth date,
    sex_at_birth character varying(100),
    gender_identity character varying(100),
    status character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    custom_attributes jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_participants_birth_date CHECK (((date_of_birth IS NULL) OR (date_of_birth <= CURRENT_DATE))),
    CONSTRAINT ck_participants_status CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'DECEASED'::character varying, 'MERGED'::character varying])::text[])))
);


ALTER TABLE enrollnow.participants OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 29635)
-- Name: permissions; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(150) NOT NULL,
    name character varying(200) NOT NULL,
    resource character varying(100),
    action character varying(50),
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.permissions OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 30222)
-- Name: recruitment_sources; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.recruitment_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    description character varying(500),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


ALTER TABLE enrollnow.recruitment_sources OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 29650)
-- Name: role_permissions; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.role_permissions OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 29612)
-- Name: roles; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    scope_type character varying(30) NOT NULL,
    description text,
    system_role boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_roles_scope_type CHECK (((scope_type)::text = ANY ((ARRAY['GLOBAL'::character varying, 'TENANT'::character varying, 'SITE'::character varying, 'TEAM'::character varying, 'STUDY'::character varying])::text[])))
);


ALTER TABLE enrollnow.roles OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 30421)
-- Name: screening_answers; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.screening_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    screening_session_id uuid NOT NULL,
    question_code character varying(100) NOT NULL,
    question_text_snapshot text,
    answer_value jsonb,
    answered_at timestamp with time zone DEFAULT now() NOT NULL,
    answered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.screening_answers OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 30457)
-- Name: screening_outcomes; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.screening_outcomes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    screening_session_id uuid NOT NULL,
    outcome character varying(30) NOT NULL,
    reason_code character varying(100),
    reason_text character varying(500),
    evaluated_at timestamp with time zone DEFAULT now() NOT NULL,
    evaluated_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_screening_outcomes_outcome CHECK (((outcome)::text = ANY ((ARRAY['QUALIFIED'::character varying, 'DISQUALIFIED'::character varying, 'PENDING'::character varying, 'INCOMPLETE'::character varying])::text[])))
);


ALTER TABLE enrollnow.screening_outcomes OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 30376)
-- Name: screening_sessions; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.screening_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    status character varying(30) DEFAULT 'IN_PROGRESS'::character varying NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    screened_by_user_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_screening_sessions_attempt CHECK ((attempt_number > 0)),
    CONSTRAINT ck_screening_sessions_dates CHECK (((completed_at IS NULL) OR (completed_at >= started_at))),
    CONSTRAINT ck_screening_sessions_status CHECK (((status)::text = ANY ((ARRAY['IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'ABANDONED'::character varying])::text[])))
);


ALTER TABLE enrollnow.screening_sessions OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 29579)
-- Name: security_settings; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.security_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    max_failed_login_attempts integer,
    prevent_concurrent_sessions boolean DEFAULT false NOT NULL,
    inactivity_logout_minutes integer,
    inactivity_lock_days integer,
    password_expiry_days integer,
    password_history_count integer,
    minimum_password_length integer,
    minimum_password_strength character varying(30),
    require_digit boolean DEFAULT false NOT NULL,
    require_symbol boolean DEFAULT false NOT NULL,
    require_mixed_case boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_security_failed_attempts CHECK (((max_failed_login_attempts IS NULL) OR (max_failed_login_attempts > 0))),
    CONSTRAINT ck_security_lock_days CHECK (((inactivity_lock_days IS NULL) OR (inactivity_lock_days > 0))),
    CONSTRAINT ck_security_logout_minutes CHECK (((inactivity_logout_minutes IS NULL) OR (inactivity_logout_minutes > 0))),
    CONSTRAINT ck_security_password_expiry CHECK (((password_expiry_days IS NULL) OR (password_expiry_days > 0))),
    CONSTRAINT ck_security_password_history CHECK (((password_history_count IS NULL) OR (password_history_count >= 0))),
    CONSTRAINT ck_security_password_length CHECK (((minimum_password_length IS NULL) OR (minimum_password_length > 0)))
);


ALTER TABLE enrollnow.security_settings OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 29439)
-- Name: sites; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    site_code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state_region character varying(100),
    postal_code character varying(30),
    country_code character varying(3),
    phone character varying(50),
    email character varying(320),
    timezone character varying(100),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


ALTER TABLE enrollnow.sites OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 29805)
-- Name: studies; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.studies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    long_name text,
    prefix character varying(50),
    description text,
    irb_id character varying(100),
    recruitment_start_date date,
    recruitment_end_date date,
    completion_date date,
    sample_size integer,
    locale character varying(20),
    custom_id_generation_enabled boolean DEFAULT false NOT NULL,
    next_sequential_identifier bigint DEFAULT 0 NOT NULL,
    allow_participation_in_other_studies boolean DEFAULT true NOT NULL,
    show_global_comments boolean DEFAULT false NOT NULL,
    default_global_logs boolean DEFAULT false NOT NULL,
    study_url_label character varying(100),
    study_url text,
    archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_studies_dates CHECK (((recruitment_end_date IS NULL) OR (recruitment_start_date IS NULL) OR (recruitment_end_date >= recruitment_start_date))),
    CONSTRAINT ck_studies_next_identifier CHECK ((next_sequential_identifier >= 0)),
    CONSTRAINT ck_studies_sample_size CHECK (((sample_size IS NULL) OR (sample_size >= 0)))
);


ALTER TABLE enrollnow.studies OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 30294)
-- Name: study_candidates; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.study_candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    referral_id uuid,
    status character varying(30) DEFAULT 'REFERRED'::character varying NOT NULL,
    status_reason character varying(500),
    assigned_to_user_id uuid,
    first_contact_at timestamp with time zone,
    last_contact_at timestamp with time zone,
    qualified_at timestamp with time zone,
    disqualified_at timestamp with time zone,
    withdrawn_at timestamp with time zone,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_study_candidates_status CHECK (((status)::text = ANY ((ARRAY['REFERRED'::character varying, 'CONTACTED'::character varying, 'SCREENING'::character varying, 'QUALIFIED'::character varying, 'DISQUALIFIED'::character varying, 'WITHDRAWN'::character varying])::text[])))
);


ALTER TABLE enrollnow.study_candidates OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 30617)
-- Name: study_enrollments; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.study_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    candidate_id uuid,
    consent_id uuid NOT NULL,
    study_participant_id character varying(100),
    status character varying(30) DEFAULT 'ENROLLED'::character varying NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    enrolled_by_user_id uuid,
    completed_at timestamp with time zone,
    withdrawn_at timestamp with time zone,
    withdrawal_reason character varying(500),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_study_enrollments_dates CHECK ((((completed_at IS NULL) OR (completed_at >= enrolled_at)) AND ((withdrawn_at IS NULL) OR (withdrawn_at >= enrolled_at)))),
    CONSTRAINT ck_study_enrollments_status CHECK (((status)::text = ANY ((ARRAY['ENROLLED'::character varying, 'ACTIVE'::character varying, 'COMPLETED'::character varying, 'WITHDRAWN'::character varying])::text[])))
);


ALTER TABLE enrollnow.study_enrollments OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 29931)
-- Name: study_grants; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.study_grants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid NOT NULL,
    grant_number character varying(100),
    agency character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.study_grants OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 29902)
-- Name: study_members; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.study_members (
    tenant_id uuid NOT NULL,
    study_id uuid NOT NULL,
    user_id uuid NOT NULL,
    active boolean DEFAULT true NOT NULL,
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    study_role character varying(100)
);


ALTER TABLE enrollnow.study_members OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 29977)
-- Name: study_milestones; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.study_milestones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid NOT NULL,
    milestone_date date NOT NULL,
    participant_target integer,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_study_milestones_target CHECK (((participant_target IS NULL) OR (participant_target >= 0)))
);


ALTER TABLE enrollnow.study_milestones OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 29953)
-- Name: study_requirements; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.study_requirements (
    study_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    sample_size integer,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_study_requirements_sample_size CHECK (((sample_size IS NULL) OR (sample_size >= 0)))
);


ALTER TABLE enrollnow.study_requirements OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 29847)
-- Name: study_sites; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.study_sites (
    tenant_id uuid NOT NULL,
    study_id uuid NOT NULL,
    site_id uuid NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.study_sites OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 30960)
-- Name: survey_answers; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.survey_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    survey_response_id uuid NOT NULL,
    question_id uuid NOT NULL,
    question_code_snapshot character varying(100) NOT NULL,
    question_text_snapshot text,
    answer_value jsonb,
    answered_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.survey_answers OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 30855)
-- Name: survey_assignments; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.survey_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    survey_version_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    study_id uuid,
    candidate_id uuid,
    enrollment_id uuid,
    assigned_by_user_id uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    due_at timestamp with time zone,
    status character varying(30) DEFAULT 'ASSIGNED'::character varying NOT NULL,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_survey_assignments_dates CHECK ((((due_at IS NULL) OR (due_at >= assigned_at)) AND ((completed_at IS NULL) OR (completed_at >= assigned_at)) AND ((cancelled_at IS NULL) OR (cancelled_at >= assigned_at)))),
    CONSTRAINT ck_survey_assignments_status CHECK (((status)::text = ANY ((ARRAY['ASSIGNED'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'EXPIRED'::character varying])::text[])))
);


ALTER TABLE enrollnow.survey_assignments OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 30710)
-- Name: survey_definitions; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.survey_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


ALTER TABLE enrollnow.survey_definitions OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 30821)
-- Name: survey_question_options; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.survey_question_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    question_id uuid NOT NULL,
    option_value character varying(255) NOT NULL,
    option_label character varying(500) NOT NULL,
    display_order integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT ck_survey_question_options_order CHECK ((display_order > 0))
);


ALTER TABLE enrollnow.survey_question_options OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 30782)
-- Name: survey_questions; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.survey_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    survey_version_id uuid NOT NULL,
    question_code character varying(100) NOT NULL,
    question_type character varying(50) NOT NULL,
    question_text text NOT NULL,
    help_text text,
    required boolean DEFAULT false NOT NULL,
    display_order integer NOT NULL,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT ck_survey_questions_display_order CHECK ((display_order > 0))
);


ALTER TABLE enrollnow.survey_questions OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 30917)
-- Name: survey_responses; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.survey_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    survey_assignment_id uuid NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    status character varying(30) DEFAULT 'IN_PROGRESS'::character varying NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    entered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_survey_responses_attempt CHECK ((attempt_number > 0)),
    CONSTRAINT ck_survey_responses_dates CHECK (((submitted_at IS NULL) OR (submitted_at >= started_at))),
    CONSTRAINT ck_survey_responses_status CHECK (((status)::text = ANY ((ARRAY['IN_PROGRESS'::character varying, 'SUBMITTED'::character varying, 'ABANDONED'::character varying])::text[])))
);


ALTER TABLE enrollnow.survey_responses OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 30744)
-- Name: survey_versions; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.survey_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    survey_definition_id uuid NOT NULL,
    version_number character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    introduction_text text,
    completion_text text,
    status character varying(30) DEFAULT 'DRAFT'::character varying NOT NULL,
    published_at timestamp with time zone,
    retired_at timestamp with time zone,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_survey_versions_dates CHECK (((retired_at IS NULL) OR (published_at IS NULL) OR (retired_at >= published_at))),
    CONSTRAINT ck_survey_versions_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PUBLISHED'::character varying, 'RETIRED'::character varying])::text[])))
);


ALTER TABLE enrollnow.survey_versions OWNER TO postgres;

--
-- TOC entry 270 (class 1259 OID 31065)
-- Name: task_assignments; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.task_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assignment_role character varying(30) DEFAULT 'ASSIGNEE'::character varying NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_by_user_id uuid,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_task_assignments_role CHECK (((assignment_role)::text = ANY ((ARRAY['ASSIGNEE'::character varying, 'OWNER'::character varying, 'WATCHER'::character varying])::text[])))
);


ALTER TABLE enrollnow.task_assignments OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 31110)
-- Name: task_status_history; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.task_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    task_id uuid NOT NULL,
    previous_status character varying(30),
    new_status character varying(30) NOT NULL,
    reason character varying(500),
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    changed_by uuid,
    CONSTRAINT ck_task_status_history_new CHECK (((new_status)::text = ANY ((ARRAY['OPEN'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT ck_task_status_history_previous CHECK (((previous_status IS NULL) OR ((previous_status)::text = ANY ((ARRAY['OPEN'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[]))))
);


ALTER TABLE enrollnow.task_status_history OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 31000)
-- Name: tasks; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    study_id uuid,
    participant_id uuid,
    candidate_id uuid,
    enrollment_id uuid,
    title character varying(255) NOT NULL,
    description text,
    task_type character varying(50),
    priority character varying(20) DEFAULT 'NORMAL'::character varying NOT NULL,
    status character varying(30) DEFAULT 'OPEN'::character varying NOT NULL,
    due_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_by_user_id uuid,
    completed_by_user_id uuid,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_tasks_dates CHECK ((((completed_at IS NULL) OR (completed_at >= created_at)) AND ((cancelled_at IS NULL) OR (cancelled_at >= created_at)))),
    CONSTRAINT ck_tasks_priority CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'NORMAL'::character varying, 'HIGH'::character varying, 'URGENT'::character varying])::text[]))),
    CONSTRAINT ck_tasks_status CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE enrollnow.tasks OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 29669)
-- Name: team_memberships; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.team_memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    active boolean DEFAULT true NOT NULL,
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


ALTER TABLE enrollnow.team_memberships OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 29876)
-- Name: team_studies; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.team_studies (
    tenant_id uuid NOT NULL,
    team_id uuid NOT NULL,
    study_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.team_studies OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 29467)
-- Name: teams; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    multi_study_participation boolean DEFAULT true NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


ALTER TABLE enrollnow.teams OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 29417)
-- Name: tenants; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    status character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    default_timezone character varying(100),
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_tenants_status CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'SUSPENDED'::character varying])::text[])))
);


ALTER TABLE enrollnow.tenants OWNER TO postgres;

--
-- TOC entry 6328 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE tenants; Type: COMMENT; Schema: enrollnow; Owner: postgres
--

COMMENT ON TABLE enrollnow.tenants IS 'Top-level customer/client ownership boundary for the multi-tenant EnrollNow platform.';


--
-- TOC entry 6329 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN tenants.configuration; Type: COMMENT; Schema: enrollnow; Owner: postgres
--

COMMENT ON COLUMN enrollnow.tenants.configuration IS 'Non-secret tenant-specific business/runtime configuration. Infrastructure settings remain deployment configuration and secrets belong in an approved secrets manager.';


--
-- TOC entry 235 (class 1259 OID 29762)
-- Name: user_action_tokens; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.user_action_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type character varying(30) NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_user_action_token_type CHECK (((token_type)::text = ANY ((ARRAY['PASSWORD_RESET'::character varying, 'ENROLLMENT'::character varying])::text[])))
);


ALTER TABLE enrollnow.user_action_tokens OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 29523)
-- Name: user_emails; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.user_emails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    email character varying(320) NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    primary_email boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.user_emails OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 29744)
-- Name: user_password_history; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.user_password_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE enrollnow.user_password_history OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 29700)
-- Name: user_role_assignments; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.user_role_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    site_id uuid,
    team_id uuid,
    effective_from timestamp with time zone,
    effective_to timestamp with time zone,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    study_id uuid,
    CONSTRAINT ck_user_role_assignment_dates CHECK (((effective_to IS NULL) OR (effective_from IS NULL) OR (effective_to >= effective_from))),
    CONSTRAINT ck_user_role_assignment_single_scope CHECK ((((
CASE
    WHEN (site_id IS NOT NULL) THEN 1
    ELSE 0
END +
CASE
    WHEN (team_id IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (study_id IS NOT NULL) THEN 1
    ELSE 0
END) <= 1))
);


ALTER TABLE enrollnow.user_role_assignments OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 29555)
-- Name: user_security_state; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.user_security_state (
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    locked_at timestamp with time zone,
    lock_reason character varying(255),
    password_expires_at timestamp with time zone,
    last_password_reset_at timestamp with time zone,
    last_activity_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_failed_login_attempts CHECK ((failed_login_attempts >= 0))
);


ALTER TABLE enrollnow.user_security_state OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 29785)
-- Name: user_sessions; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    session_token_hash character varying(255),
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_activity_at timestamp with time zone,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    revoke_reason character varying(255)
);


ALTER TABLE enrollnow.user_sessions OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 29495)
-- Name: users; Type: TABLE; Schema: enrollnow; Owner: postgres
--

CREATE TABLE enrollnow.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    title character varying(150),
    timezone character varying(100),
    status character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    password_hash character varying(255),
    password_last_changed_at timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT ck_users_status CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'DISABLED'::character varying, 'LOCKED'::character varying])::text[])))
);


ALTER TABLE enrollnow.users OWNER TO postgres;

--
-- TOC entry 6315 (class 0 OID 31561)
-- Dependencies: 281
-- Data for Name: audit_events; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.audit_events (id, tenant_id, actor_user_id, entity_type, entity_id, action, description, source, correlation_id, request_id, before_data, after_data, occurred_at, created_at) FROM stdin;
\.


--
-- TOC entry 6307 (class 0 OID 31199)
-- Dependencies: 273
-- Data for Name: calendar_event_attendees; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.calendar_event_attendees (id, tenant_id, calendar_event_id, user_id, attendee_role, response_status, active, created_at) FROM stdin;
\.


--
-- TOC entry 6306 (class 0 OID 31139)
-- Dependencies: 272
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.calendar_events (id, tenant_id, study_id, participant_id, candidate_id, enrollment_id, title, description, event_type, location, start_at, end_at, all_day, status, created_by_user_id, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6287 (class 0 OID 30347)
-- Dependencies: 253
-- Data for Name: candidate_status_history; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.candidate_status_history (id, tenant_id, candidate_id, previous_status, new_status, reason, changed_at, changed_by) FROM stdin;
\.


--
-- TOC entry 6311 (class 0 OID 31380)
-- Dependencies: 277
-- Data for Name: communication_delivery_events; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.communication_delivery_events (id, tenant_id, communication_id, recipient_id, event_type, event_at, provider, provider_event_id, error_code, error_message, provider_payload, created_at) FROM stdin;
\.


--
-- TOC entry 6310 (class 0 OID 31340)
-- Dependencies: 276
-- Data for Name: communication_recipients; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.communication_recipients (id, tenant_id, communication_id, participant_id, recipient_type, recipient_name, recipient_value, active, created_at) FROM stdin;
\.


--
-- TOC entry 6308 (class 0 OID 31239)
-- Dependencies: 274
-- Data for Name: communication_templates; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.communication_templates (id, tenant_id, study_id, code, name, channel, subject_template, body_template, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6309 (class 0 OID 31275)
-- Dependencies: 275
-- Data for Name: communications; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.communications (id, tenant_id, study_id, participant_id, candidate_id, enrollment_id, template_id, channel, direction, subject_snapshot, body_snapshot, status, initiated_by_user_id, created_at, sent_at, completed_at, external_message_id, metadata) FROM stdin;
\.


--
-- TOC entry 6293 (class 0 OID 30588)
-- Dependencies: 259
-- Data for Name: consent_history; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.consent_history (id, tenant_id, consent_id, previous_status, new_status, reason, changed_at, changed_by) FROM stdin;
\.


--
-- TOC entry 6291 (class 0 OID 30494)
-- Dependencies: 257
-- Data for Name: consent_versions; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.consent_versions (id, tenant_id, study_id, version_number, title, description, external_reference, effective_from, effective_to, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6292 (class 0 OID 30529)
-- Dependencies: 258
-- Data for Name: consents; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.consents (id, tenant_id, study_id, participant_id, candidate_id, consent_version_id, status, consented_at, declined_at, withdrawn_at, consented_by_user_id, consent_method, withdrawal_reason, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6314 (class 0 OID 31495)
-- Dependencies: 280
-- Data for Name: document_links; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.document_links (id, tenant_id, document_id, study_id, participant_id, candidate_id, consent_id, enrollment_id, communication_id, task_id, link_type, active, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 6313 (class 0 OID 31455)
-- Dependencies: 279
-- Data for Name: document_versions; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.document_versions (id, tenant_id, document_id, version_number, file_name, mime_type, file_size_bytes, storage_provider, storage_bucket, storage_key, checksum_algorithm, checksum_value, uploaded_by_user_id, created_at) FROM stdin;
\.


--
-- TOC entry 6312 (class 0 OID 31418)
-- Dependencies: 278
-- Data for Name: documents; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.documents (id, tenant_id, document_type, name, description, status, created_by_user_id, metadata, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6295 (class 0 OID 30681)
-- Dependencies: 261
-- Data for Name: enrollment_status_history; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.enrollment_status_history (id, tenant_id, enrollment_id, previous_status, new_status, reason, changed_at, changed_by) FROM stdin;
\.


--
-- TOC entry 6316 (class 0 OID 31596)
-- Dependencies: 282
-- Data for Name: entity_change_history; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.entity_change_history (id, tenant_id, audit_event_id, entity_type, entity_id, field_name, previous_value, new_value, changed_at) FROM stdin;
\.


--
-- TOC entry 6319 (class 0 OID 31708)
-- Dependencies: 285
-- Data for Name: external_system_links; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.external_system_links (id, tenant_id, external_system, entity_type, entity_id, external_identifier, external_identifier_type, source_system, active, metadata, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6255 (class 0 OID 29362)
-- Dependencies: 221
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
0	\N	<< Flyway Schema Creation >>	SCHEMA	"enrollnow"	\N	postgres	2026-10-19 10:49:34.345827	0	t
1	1	platform foundation	SQL	V1__platform_foundation.sql	1582456794	postgres	2026-10-19 10:49:34.384605	26	t
2	2	identity and rbac	SQL	V2__identity_and_rbac.sql	582102541	postgres	2026-10-19 10:49:34.427028	43	t
3	3	study foundation	SQL	V3__study_foundation.sql	330248483	postgres	2026-10-19 10:58:15.870949	51	t
4	4	identity access refinements	SQL	V4__identity_access_refinements.sql	-209834042	postgres	2026-10-19 10:58:15.9464	1	t
5	5	seed study permission roles	SQL	V5__seed_study_permission_roles.sql	1819221197	postgres	2026-10-19 10:58:15.952733	2	t
6	6	study permission catalog	SQL	V6__study_permission_catalog.sql	-2068012906	postgres	2026-10-19 10:58:15.960047	8	t
7	7	site permission roles	SQL	V7__site_permission_roles.sql	2059385741	postgres	2026-10-19 10:58:15.976829	3	t
8	8	participant core	SQL	V8__participant_core.sql	-2124220995	postgres	2026-10-19 10:58:15.987747	39	t
9	9	recruitment screening	SQL	V9__recruitment_screening.sql	1804036213	postgres	2026-10-19 10:58:16.038477	44	t
10	10	consent enrollment	SQL	V10__consent_enrollment.sql	-1395936714	postgres	2026-10-19 10:58:16.093061	30	t
11	11	survey questionnaire	SQL	V11__survey_questionnaire.sql	1247882966	postgres	2026-10-19 10:58:16.132627	44	t
12	12	tasks calendar	SQL	V12__tasks_calendar.sql	305480124	postgres	2026-10-19 10:58:16.196388	34	t
13	13	communications	SQL	V13__communications.sql	-357267575	postgres	2026-10-19 10:58:16.241156	26	t
14	14	documents	SQL	V14__documents.sql	264266	postgres	2026-10-19 10:58:16.274074	22	t
15	15	audit history	SQL	V15__audit_history.sql	559613560	postgres	2026-10-19 10:58:16.302051	19	t
16	16	transactional outbox	SQL	V16__transactional_outbox.sql	-1454377356	postgres	2026-10-19 10:58:16.328455	16	t
17	17	integration external refs	SQL	V17__integration_external_refs.sql	-882601943	postgres	2026-10-19 10:58:16.351546	25	t
\.


--
-- TOC entry 6321 (class 0 OID 31777)
-- Dependencies: 287
-- Data for Name: integration_event_attempts; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.integration_event_attempts (id, tenant_id, integration_event_id, attempt_number, processor, started_at, completed_at, status, http_status, error_code, error_message, response_payload, created_at) FROM stdin;
\.


--
-- TOC entry 6320 (class 0 OID 31742)
-- Dependencies: 286
-- Data for Name: integration_events; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.integration_events (id, tenant_id, external_system, direction, event_type, entity_type, entity_id, external_event_id, correlation_id, request_id, status, request_payload, response_payload, received_at, processing_started_at, completed_at, failed_at, retry_count, last_error_code, last_error_message, created_at) FROM stdin;
\.


--
-- TOC entry 6318 (class 0 OID 31672)
-- Dependencies: 284
-- Data for Name: outbox_event_attempts; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.outbox_event_attempts (id, tenant_id, outbox_event_id, attempt_number, processor, started_at, completed_at, status, error_message, created_at) FROM stdin;
\.


--
-- TOC entry 6317 (class 0 OID 31630)
-- Dependencies: 283
-- Data for Name: outbox_events; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.outbox_events (id, tenant_id, aggregate_type, aggregate_id, event_type, event_version, payload, metadata, correlation_id, causation_id, idempotency_key, status, available_at, created_at, locked_at, locked_by, published_at, failed_at, retry_count, last_error) FROM stdin;
\.


--
-- TOC entry 6281 (class 0 OID 30122)
-- Dependencies: 247
-- Data for Name: participant_addresses; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.participant_addresses (id, tenant_id, participant_id, address_type, address_line1, address_line2, city, state_region, postal_code, country_code, primary_address, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6280 (class 0 OID 30083)
-- Dependencies: 246
-- Data for Name: participant_contacts; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.participant_contacts (id, tenant_id, participant_id, contact_type, contact_value, label, primary_contact, verified, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6279 (class 0 OID 30049)
-- Dependencies: 245
-- Data for Name: participant_identifiers; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.participant_identifiers (id, tenant_id, participant_id, identifier_type, identifier_value, issuing_system, primary_identifier, active, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 6282 (class 0 OID 30158)
-- Dependencies: 248
-- Data for Name: participant_preferences; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.participant_preferences (participant_id, tenant_id, preferred_language, timezone, allow_email, allow_sms, allow_phone, do_not_contact, configuration, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6285 (class 0 OID 30250)
-- Dependencies: 251
-- Data for Name: participant_referrals; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.participant_referrals (id, tenant_id, participant_id, source_id, study_id, referral_date, referrer_name, referrer_contact, external_reference, notes, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6283 (class 0 OID 30193)
-- Dependencies: 249
-- Data for Name: participant_status_history; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.participant_status_history (id, tenant_id, participant_id, previous_status, new_status, reason, changed_at, changed_by) FROM stdin;
\.


--
-- TOC entry 6278 (class 0 OID 30011)
-- Dependencies: 244
-- Data for Name: participants; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.participants (id, tenant_id, site_id, first_name, middle_name, last_name, preferred_name, date_of_birth, sex_at_birth, gender_identity, status, custom_attributes, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6264 (class 0 OID 29635)
-- Dependencies: 230
-- Data for Name: permissions; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.permissions (id, code, name, resource, action, description, created_at) FROM stdin;
52000000-0000-0000-0000-000000000001	STUDY_DASHBOARD_READ	View Study Dashboard	STUDY_DASHBOARD	READ	Allows viewing the study dashboard.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000002	TASK_READ	View Tasks	TASK	READ	Allows viewing study tasks subject to applicable PHI restrictions.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000003	RECRUITMENT_READ	View Recruitment	RECRUITMENT	READ	Allows viewing study recruitment information.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000004	RECRUITMENT_MANAGE	Manage Recruitment	RECRUITMENT	MANAGE	Allows making changes to study recruitment information.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000005	CALENDAR_READ	View Calendar	CALENDAR	READ	Allows viewing the study calendar subject to applicable PHI restrictions.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000006	POTENTIAL_PARTICIPANT_READ	View Potential Participants	POTENTIAL_PARTICIPANT	READ	Allows viewing potential participant records.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000007	POTENTIAL_PARTICIPANT_MANAGE	Manage Potential Participants	POTENTIAL_PARTICIPANT	MANAGE	Allows management of potential participant records.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000008	ENROLLED_PARTICIPANT_READ	View Enrolled Participants	ENROLLED_PARTICIPANT	READ	Allows viewing enrolled participant records.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000009	ENROLLED_PARTICIPANT_MANAGE	Manage Enrolled Participants	ENROLLED_PARTICIPANT	MANAGE	Allows management of enrolled participant records.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000010	STUDY_SETTINGS_MANAGE	Manage Study Settings	STUDY_SETTINGS	MANAGE	Allows access to and management of study settings.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000011	REPORT_READ	View Study Reports	REPORT	READ	Allows viewing study reports.	2026-10-19 10:58:15.964808+05:30
52000000-0000-0000-0000-000000000012	PHI_READ	View Protected Health Information	PHI	READ	Allows viewing participant-identifiable or protected health information where applicable.	2026-10-19 10:58:15.964808+05:30
\.


--
-- TOC entry 6284 (class 0 OID 30222)
-- Dependencies: 250
-- Data for Name: recruitment_sources; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.recruitment_sources (id, tenant_id, code, name, description, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6265 (class 0 OID 29650)
-- Dependencies: 231
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.role_permissions (role_id, permission_id, created_at) FROM stdin;
51000000-0000-0000-0000-000000000001	52000000-0000-0000-0000-000000000001	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000001	52000000-0000-0000-0000-000000000005	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000001	52000000-0000-0000-0000-000000000006	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000001	52000000-0000-0000-0000-000000000008	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000001	52000000-0000-0000-0000-000000000011	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000001	52000000-0000-0000-0000-000000000012	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000002	52000000-0000-0000-0000-000000000001	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000002	52000000-0000-0000-0000-000000000002	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000002	52000000-0000-0000-0000-000000000003	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000002	52000000-0000-0000-0000-000000000005	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000001	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000002	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000003	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000004	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000005	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000006	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000007	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000008	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000009	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000003	52000000-0000-0000-0000-000000000012	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000001	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000002	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000003	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000004	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000005	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000006	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000007	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000008	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000009	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000010	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000011	2026-10-19 10:58:15.964808+05:30
51000000-0000-0000-0000-000000000004	52000000-0000-0000-0000-000000000012	2026-10-19 10:58:15.964808+05:30
\.


--
-- TOC entry 6263 (class 0 OID 29612)
-- Dependencies: 229
-- Data for Name: roles; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.roles (id, code, name, scope_type, description, system_role, active, created_at, updated_at) FROM stdin;
51000000-0000-0000-0000-000000000001	STUDY_READ_ONLY	Study Read-Only	STUDY	View-only access to permitted study data and functionality.	t	t	2026-10-19 10:58:15.955916+05:30	2026-10-19 10:58:15.955916+05:30
51000000-0000-0000-0000-000000000002	STUDY_RA	Study Restricted Access	STUDY	Restricted study access intended for limited or de-identified study functionality.	t	t	2026-10-19 10:58:15.955916+05:30	2026-10-19 10:58:15.955916+05:30
51000000-0000-0000-0000-000000000003	STUDY_LEADER	Study Leader	STUDY	Operational access to participant and study activities without Study Settings administration.	t	t	2026-10-19 10:58:15.955916+05:30	2026-10-19 10:58:15.955916+05:30
51000000-0000-0000-0000-000000000004	STUDY_ADMIN	Study Admin	STUDY	Full study-level access including Study Settings.	t	t	2026-10-19 10:58:15.955916+05:30	2026-10-19 10:58:15.955916+05:30
53000000-0000-0000-0000-000000000001	SITE_REGISTRY	Registry Access	SITE	Access to site Registry without Site Admin access.	t	t	2026-10-19 10:58:15.981248+05:30	2026-10-19 10:58:15.981248+05:30
53000000-0000-0000-0000-000000000002	SITE_MANAGER	Site Manager	SITE	Registry access and Site Admin capabilities limited to assigned studies.	t	t	2026-10-19 10:58:15.981248+05:30	2026-10-19 10:58:15.981248+05:30
53000000-0000-0000-0000-000000000003	SITE_ADMIN	Site Admin	SITE	Full Registry and Site Admin access across the site.	t	t	2026-10-19 10:58:15.981248+05:30	2026-10-19 10:58:15.981248+05:30
\.


--
-- TOC entry 6289 (class 0 OID 30421)
-- Dependencies: 255
-- Data for Name: screening_answers; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.screening_answers (id, tenant_id, screening_session_id, question_code, question_text_snapshot, answer_value, answered_at, answered_by_user_id, created_at) FROM stdin;
\.


--
-- TOC entry 6290 (class 0 OID 30457)
-- Dependencies: 256
-- Data for Name: screening_outcomes; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.screening_outcomes (id, tenant_id, screening_session_id, outcome, reason_code, reason_text, evaluated_at, evaluated_by_user_id, created_at) FROM stdin;
\.


--
-- TOC entry 6288 (class 0 OID 30376)
-- Dependencies: 254
-- Data for Name: screening_sessions; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.screening_sessions (id, tenant_id, candidate_id, attempt_number, status, started_at, completed_at, screened_by_user_id, notes, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6262 (class 0 OID 29579)
-- Dependencies: 228
-- Data for Name: security_settings; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.security_settings (id, tenant_id, max_failed_login_attempts, prevent_concurrent_sessions, inactivity_logout_minutes, inactivity_lock_days, password_expiry_days, password_history_count, minimum_password_length, minimum_password_strength, require_digit, require_symbol, require_mixed_case, created_at, created_by, updated_at, updated_by) FROM stdin;
61000000-0000-0000-0000-000000000001	11111111-1111-1111-1111-111111111111	5	f	60	\N	\N	0	12	\N	t	t	t	2026-10-19 11:01:17.437981+05:30	\N	2026-10-19 11:01:17.437981+05:30	\N
\.


--
-- TOC entry 6257 (class 0 OID 29439)
-- Dependencies: 223
-- Data for Name: sites; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.sites (id, tenant_id, site_code, name, description, address_line1, address_line2, city, state_region, postal_code, country_code, phone, email, timezone, active, created_at, created_by, updated_at, updated_by) FROM stdin;
22222222-2222-2222-2222-222222222201	11111111-1111-1111-1111-111111111111	SITE001	Demo Clinical Research Center	Demo Clinical Research Center	\N	\N	Boston	MA	\N	USA	\N	\N	America/New_York	t	2026-10-19 11:01:17.437981+05:30	\N	2026-10-19 11:01:17.437981+05:30	\N
\.


--
-- TOC entry 6271 (class 0 OID 29805)
-- Dependencies: 237
-- Data for Name: studies; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.studies (id, tenant_id, study_code, name, long_name, prefix, description, irb_id, recruitment_start_date, recruitment_end_date, completion_date, sample_size, locale, custom_id_generation_enabled, next_sequential_identifier, allow_participation_in_other_studies, show_global_comments, default_global_logs, study_url_label, study_url, archived, created_at, created_by, updated_at, updated_by) FROM stdin;
77777777-7777-7777-7777-777777777701	11111111-1111-1111-1111-111111111111	REG_HIV	REG - HIV	\N	\N	\N	\N	2024-01-01	2030-12-31	\N	500	\N	f	0	t	t	t	\N	\N	f	2026-10-19 13:36:45.480086+05:30	\N	2026-10-19 13:36:45.480086+05:30	\N
77777777-7777-7777-7777-777777777702	11111111-1111-1111-1111-111111111111	REG_AD_MCI	REG - AD/MCI	\N	\N	\N	\N	2024-01-01	2030-12-31	\N	500	\N	f	0	t	t	t	\N	\N	f	2026-10-19 15:08:13.319582+05:30	\N	2026-10-19 15:08:13.319582+05:30	\N
77777777-7777-7777-7777-777777777703	11111111-1111-1111-1111-111111111111	STUDY_ALPHA	Cognitive Aging Study	\N	\N	\N	\N	2025-01-01	2027-12-31	\N	250	\N	f	0	t	f	f	\N	\N	f	2026-10-19 15:08:13.319582+05:30	\N	2026-10-19 15:08:13.319582+05:30	\N
77777777-7777-7777-7777-777777777704	11111111-1111-1111-1111-111111111111	STUDY_BETA	Memory Research Program	\N	\N	\N	\N	2025-06-01	2028-06-30	\N	180	\N	f	0	f	t	f	\N	\N	f	2026-10-19 15:08:13.319582+05:30	\N	2026-10-19 15:08:13.319582+05:30	\N
77777777-7777-7777-7777-777777777705	11111111-1111-1111-1111-111111111111	STUDY_ARCHIVED	Completed Pilot Study	\N	\N	\N	\N	2022-01-01	2023-12-31	\N	75	\N	f	75	f	f	t	\N	\N	t	2026-10-19 15:08:13.319582+05:30	\N	2026-10-19 15:08:13.319582+05:30	\N
\.


--
-- TOC entry 6286 (class 0 OID 30294)
-- Dependencies: 252
-- Data for Name: study_candidates; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.study_candidates (id, tenant_id, study_id, participant_id, referral_id, status, status_reason, assigned_to_user_id, first_contact_at, last_contact_at, qualified_at, disqualified_at, withdrawn_at, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6294 (class 0 OID 30617)
-- Dependencies: 260
-- Data for Name: study_enrollments; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.study_enrollments (id, tenant_id, study_id, participant_id, candidate_id, consent_id, study_participant_id, status, enrolled_at, enrolled_by_user_id, completed_at, withdrawn_at, withdrawal_reason, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6275 (class 0 OID 29931)
-- Dependencies: 241
-- Data for Name: study_grants; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.study_grants (id, tenant_id, study_id, grant_number, agency, created_at) FROM stdin;
\.


--
-- TOC entry 6274 (class 0 OID 29902)
-- Dependencies: 240
-- Data for Name: study_members; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.study_members (tenant_id, study_id, user_id, active, joined_at, created_at, study_role) FROM stdin;
11111111-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777701	c7638880-1881-41dd-80f7-f4ffd1057ae4	t	2026-10-19 13:37:37.447566+05:30	2026-10-19 13:37:37.447566+05:30	RA
11111111-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777703	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	t	2026-10-19 15:12:06.224257+05:30	2026-10-19 15:12:06.224257+05:30	Leader
11111111-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777702	fb35b1b6-cf3c-40fd-aa31-0d3d3dc1b6d4	t	2026-10-19 15:18:48.841256+05:30	2026-10-19 15:18:48.841256+05:30	Admin
11111111-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777704	fb35b1b6-cf3c-40fd-aa31-0d3d3dc1b6d4	t	2026-10-19 15:18:49.021248+05:30	2026-10-19 15:18:49.021248+05:30	RA
\.


--
-- TOC entry 6277 (class 0 OID 29977)
-- Dependencies: 243
-- Data for Name: study_milestones; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.study_milestones (id, tenant_id, study_id, milestone_date, participant_target, description, created_at) FROM stdin;
\.


--
-- TOC entry 6276 (class 0 OID 29953)
-- Dependencies: 242
-- Data for Name: study_requirements; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.study_requirements (study_id, tenant_id, sample_size, configuration, updated_at) FROM stdin;
77777777-7777-7777-7777-777777777701	11111111-1111-1111-1111-111111111111	500	{}	2026-10-19 15:08:13.319582+05:30
77777777-7777-7777-7777-777777777702	11111111-1111-1111-1111-111111111111	500	{}	2026-10-19 15:08:13.319582+05:30
77777777-7777-7777-7777-777777777703	11111111-1111-1111-1111-111111111111	250	{}	2026-10-19 15:08:13.319582+05:30
77777777-7777-7777-7777-777777777704	11111111-1111-1111-1111-111111111111	180	{}	2026-10-19 15:08:13.319582+05:30
77777777-7777-7777-7777-777777777705	11111111-1111-1111-1111-111111111111	75	{}	2026-10-19 15:08:13.319582+05:30
\.


--
-- TOC entry 6272 (class 0 OID 29847)
-- Dependencies: 238
-- Data for Name: study_sites; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.study_sites (tenant_id, study_id, site_id, active, created_at) FROM stdin;
\.


--
-- TOC entry 6302 (class 0 OID 30960)
-- Dependencies: 268
-- Data for Name: survey_answers; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.survey_answers (id, tenant_id, survey_response_id, question_id, question_code_snapshot, question_text_snapshot, answer_value, answered_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6300 (class 0 OID 30855)
-- Dependencies: 266
-- Data for Name: survey_assignments; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.survey_assignments (id, tenant_id, survey_version_id, participant_id, study_id, candidate_id, enrollment_id, assigned_by_user_id, assigned_at, due_at, status, completed_at, cancelled_at, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6296 (class 0 OID 30710)
-- Dependencies: 262
-- Data for Name: survey_definitions; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.survey_definitions (id, tenant_id, study_id, code, name, description, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6299 (class 0 OID 30821)
-- Dependencies: 265
-- Data for Name: survey_question_options; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.survey_question_options (id, tenant_id, question_id, option_value, option_label, display_order, active, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 6298 (class 0 OID 30782)
-- Dependencies: 264
-- Data for Name: survey_questions; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.survey_questions (id, tenant_id, survey_version_id, question_code, question_type, question_text, help_text, required, display_order, configuration, active, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 6301 (class 0 OID 30917)
-- Dependencies: 267
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.survey_responses (id, tenant_id, survey_assignment_id, attempt_number, status, started_at, submitted_at, entered_by_user_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6297 (class 0 OID 30744)
-- Dependencies: 263
-- Data for Name: survey_versions; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.survey_versions (id, tenant_id, survey_definition_id, version_number, title, introduction_text, completion_text, status, published_at, retired_at, configuration, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6304 (class 0 OID 31065)
-- Dependencies: 270
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.task_assignments (id, tenant_id, task_id, user_id, assignment_role, assigned_at, assigned_by_user_id, active, created_at) FROM stdin;
\.


--
-- TOC entry 6305 (class 0 OID 31110)
-- Dependencies: 271
-- Data for Name: task_status_history; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.task_status_history (id, tenant_id, task_id, previous_status, new_status, reason, changed_at, changed_by) FROM stdin;
\.


--
-- TOC entry 6303 (class 0 OID 31000)
-- Dependencies: 269
-- Data for Name: tasks; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.tasks (id, tenant_id, study_id, participant_id, candidate_id, enrollment_id, title, description, task_type, priority, status, due_at, completed_at, cancelled_at, created_by_user_id, completed_by_user_id, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6266 (class 0 OID 29669)
-- Dependencies: 232
-- Data for Name: team_memberships; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.team_memberships (id, tenant_id, team_id, user_id, active, joined_at, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 6273 (class 0 OID 29876)
-- Dependencies: 239
-- Data for Name: team_studies; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.team_studies (tenant_id, team_id, study_id, created_at) FROM stdin;
\.


--
-- TOC entry 6258 (class 0 OID 29467)
-- Dependencies: 224
-- Data for Name: teams; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.teams (id, tenant_id, name, description, multi_study_participation, active, created_at, created_by, updated_at, updated_by) FROM stdin;
\.


--
-- TOC entry 6256 (class 0 OID 29417)
-- Dependencies: 222
-- Data for Name: tenants; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.tenants (id, code, name, status, default_timezone, configuration, created_at, created_by, updated_at, updated_by) FROM stdin;
11111111-1111-1111-1111-111111111111	TESTTENANT	EnrollNow Demo Tenant	ACTIVE	America/Chicago	{}	2026-10-19 11:01:17.437981+05:30	\N	2026-10-19 11:01:17.437981+05:30	\N
\.


--
-- TOC entry 6269 (class 0 OID 29762)
-- Dependencies: 235
-- Data for Name: user_action_tokens; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.user_action_tokens (id, tenant_id, user_id, token_type, token_hash, expires_at, used_at, created_at) FROM stdin;
6858cad2-8f0c-427c-b762-e896135c5710	11111111-1111-1111-1111-111111111111	c7638880-1881-41dd-80f7-f4ffd1057ae4	ENROLLMENT	affe9d735c6b0fc4f1673ee89e47451ca239e647ae01037d7ff0fc96b4b26c1b	2026-11-02 11:02:53.503271+05:30	\N	2026-10-19 11:02:53.52586+05:30
a4841248-98e8-4d43-84b6-65e1e3a3330c	11111111-1111-1111-1111-111111111111	fb35b1b6-cf3c-40fd-aa31-0d3d3dc1b6d4	ENROLLMENT	77bc052c97859aa0ab6893dba3120aa56f10e7352ebdc6ca23801138f9a27175	2026-11-02 15:18:49.200375+05:30	\N	2026-10-19 15:18:49.224399+05:30
\.


--
-- TOC entry 6260 (class 0 OID 29523)
-- Dependencies: 226
-- Data for Name: user_emails; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.user_emails (id, tenant_id, user_id, email, verified, primary_email, created_at) FROM stdin;
a96aa132-fbf1-4314-aa89-65ddacaba5d4	11111111-1111-1111-1111-111111111111	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	suneel.kumar@solventek.com	t	t	2026-10-19 11:01:17.437981+05:30
82e7e160-d8f8-409d-bef7-f0c205221b1b	11111111-1111-1111-1111-111111111111	c7638880-1881-41dd-80f7-f4ffd1057ae4	testpoc@solventek.com	f	t	2026-10-19 11:02:52.526058+05:30
1a4f898d-567c-4f5c-a4b3-bbff6a2fd26e	11111111-1111-1111-1111-111111111111	fb35b1b6-cf3c-40fd-aa31-0d3d3dc1b6d4	test@test.com	f	t	2026-10-19 15:18:48.463489+05:30
\.


--
-- TOC entry 6268 (class 0 OID 29744)
-- Dependencies: 234
-- Data for Name: user_password_history; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.user_password_history (id, tenant_id, user_id, password_hash, created_at) FROM stdin;
\.


--
-- TOC entry 6267 (class 0 OID 29700)
-- Dependencies: 233
-- Data for Name: user_role_assignments; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.user_role_assignments (id, tenant_id, user_id, role_id, site_id, team_id, effective_from, effective_to, active, created_at, created_by, study_id) FROM stdin;
ff77b402-6198-47c5-812b-8ea08738ccda	11111111-1111-1111-1111-111111111111	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	51000000-0000-0000-0000-000000000004	\N	\N	2026-10-19 11:01:17.437981+05:30	\N	t	2026-10-19 11:01:17.437981+05:30	\N	\N
73118e42-afec-4368-bd1d-7f4b8996ecc6	11111111-1111-1111-1111-111111111111	c7638880-1881-41dd-80f7-f4ffd1057ae4	53000000-0000-0000-0000-000000000002	22222222-2222-2222-2222-222222222201	\N	\N	\N	t	2026-10-19 11:02:52.898732+05:30	\N	\N
60f4a0a4-752a-46eb-9670-2b16fea4d6f6	11111111-1111-1111-1111-111111111111	c7638880-1881-41dd-80f7-f4ffd1057ae4	51000000-0000-0000-0000-000000000002	\N	\N	\N	\N	t	2026-10-19 13:37:37.556095+05:30	\N	77777777-7777-7777-7777-777777777701
7a4a1ca5-8568-469f-83b3-d1b09e79e889	11111111-1111-1111-1111-111111111111	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	53000000-0000-0000-0000-000000000003	22222222-2222-2222-2222-222222222201	\N	\N	\N	t	2026-10-19 15:12:05.789871+05:30	\N	\N
ba4e5b62-1cfc-4ba6-b168-6554d12c2484	11111111-1111-1111-1111-111111111111	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	51000000-0000-0000-0000-000000000003	\N	\N	\N	\N	t	2026-10-19 15:12:06.31869+05:30	\N	77777777-7777-7777-7777-777777777703
50017d95-0adc-44f9-80c9-6d249499f965	11111111-1111-1111-1111-111111111111	fb35b1b6-cf3c-40fd-aa31-0d3d3dc1b6d4	53000000-0000-0000-0000-000000000002	22222222-2222-2222-2222-222222222201	\N	\N	\N	t	2026-10-19 15:18:48.643225+05:30	\N	\N
0344199d-e7bf-45c0-913e-8b7ec1c81b27	11111111-1111-1111-1111-111111111111	fb35b1b6-cf3c-40fd-aa31-0d3d3dc1b6d4	51000000-0000-0000-0000-000000000004	\N	\N	\N	\N	t	2026-10-19 15:18:48.864996+05:30	\N	77777777-7777-7777-7777-777777777702
377266b7-a397-4deb-aa89-cc5e3a6bf8a2	11111111-1111-1111-1111-111111111111	fb35b1b6-cf3c-40fd-aa31-0d3d3dc1b6d4	51000000-0000-0000-0000-000000000002	\N	\N	\N	\N	t	2026-10-19 15:18:49.044102+05:30	\N	77777777-7777-7777-7777-777777777704
\.


--
-- TOC entry 6261 (class 0 OID 29555)
-- Dependencies: 227
-- Data for Name: user_security_state; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.user_security_state (user_id, tenant_id, failed_login_attempts, locked_at, lock_reason, password_expires_at, last_password_reset_at, last_activity_at, created_at, updated_at) FROM stdin;
c7638880-1881-41dd-80f7-f4ffd1057ae4	11111111-1111-1111-1111-111111111111	0	\N	\N	\N	\N	\N	2026-10-19 11:02:52.570549+05:30	2026-10-19 11:02:52.570549+05:30
e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	11111111-1111-1111-1111-111111111111	0	\N	\N	\N	2026-10-19 11:01:17.437981+05:30	2026-10-19 15:05:33.739177+05:30	2026-10-19 11:01:17.437981+05:30	2026-10-19 15:05:33.770987+05:30
fb35b1b6-cf3c-40fd-aa31-0d3d3dc1b6d4	11111111-1111-1111-1111-111111111111	0	\N	\N	\N	\N	\N	2026-10-19 15:18:48.472993+05:30	2026-10-19 15:18:48.472993+05:30
\.


--
-- TOC entry 6270 (class 0 OID 29785)
-- Dependencies: 236
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.user_sessions (id, tenant_id, user_id, session_token_hash, issued_at, last_activity_at, expires_at, revoked_at, revoke_reason) FROM stdin;
401e4ea1-5fe0-4dfd-98f1-a3bc304e63dc	11111111-1111-1111-1111-111111111111	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	392665e90d7700ccb3d5d96cb703601f68a39e13487c2d0d9d2ad9d6acad4b7b	2026-10-19 11:01:39.956027+05:30	2026-10-19 11:27:37.006524+05:30	2026-10-19 12:01:39.956027+05:30	\N	\N
5c6b7fad-f0c2-450b-9f47-377eed1c1fcb	11111111-1111-1111-1111-111111111111	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	a51c8154849fcb095cbeb47d57b556d2d05f9b52203460b352664c81fc6d858f	2026-10-19 13:35:56.397291+05:30	2026-10-19 13:37:37.696841+05:30	2026-10-19 14:35:56.397291+05:30	\N	\N
a5177483-522f-439e-9f19-d2c602dbfde6	11111111-1111-1111-1111-111111111111	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	fd0a8d6adf7bf7f6126d07375000f976a0e21cb702ac5f0ef71a17c9a18d1dd6	2026-10-19 15:04:50.004421+05:30	2026-10-19 15:04:52.253578+05:30	2026-10-19 16:04:50.004421+05:30	\N	\N
b52e6e7b-082c-470e-bb54-5bf6129c591e	11111111-1111-1111-1111-111111111111	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	3516521385a1f36e754b9e9c42d4f8aa0f8ae62ed610bf8ce3589c178504ff95	2026-10-19 12:25:47.771007+05:30	2026-10-19 12:27:58.137294+05:30	2026-10-19 13:25:47.771007+05:30	\N	\N
88edcdef-0746-41e2-8b7c-c1e696387546	11111111-1111-1111-1111-111111111111	e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	2377e1c07c5110d29d0d0850653595fbd28d9f63f2f5747b53d4f401ee300180	2026-10-19 15:05:33.764334+05:30	2026-10-19 16:04:17.741905+05:30	2026-10-19 16:05:33.764334+05:30	\N	\N
\.


--
-- TOC entry 6259 (class 0 OID 29495)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: enrollnow; Owner: postgres
--

COPY enrollnow.users (id, tenant_id, first_name, last_name, title, timezone, status, password_hash, password_last_changed_at, last_login_at, created_at, created_by, updated_at, updated_by) FROM stdin;
c7638880-1881-41dd-80f7-f4ffd1057ae4	11111111-1111-1111-1111-111111111111	mytest	test	\N	America/New_York	ACTIVE	\N	\N	\N	2026-10-19 11:02:52.522468+05:30	\N	2026-10-19 13:37:37.128821+05:30	\N
e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6	11111111-1111-1111-1111-111111111111	Suneel	Kumar	\N	America/New_York	ACTIVE	$argon2id$v=19$m=16384,t=2,p=1$dhIo0MSr9PiVxRXHdfpZGw$C+4iv7wxFpSD0kKiCAdeZB4wO9tvgwq39tjLX00d7+o	2026-10-19 11:01:17.437981+05:30	2026-10-19 15:05:33.739177+05:30	2026-10-19 11:01:17.437981+05:30	\N	2026-10-19 15:12:05.519667+05:30	\N
fb35b1b6-cf3c-40fd-aa31-0d3d3dc1b6d4	11111111-1111-1111-1111-111111111111	ntt	yty	Study Coordinator	America/New_York	ACTIVE	\N	\N	\N	2026-10-19 15:18:48.460401+05:30	\N	2026-10-19 15:18:48.460401+05:30	\N
\.


--
-- TOC entry 5875 (class 2606 OID 31578)
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- TOC entry 5814 (class 2606 OID 31218)
-- Name: calendar_event_attendees calendar_event_attendees_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_event_attendees
    ADD CONSTRAINT calendar_event_attendees_pkey PRIMARY KEY (id);


--
-- TOC entry 5807 (class 2606 OID 31163)
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- TOC entry 5671 (class 2606 OID 30362)
-- Name: candidate_status_history candidate_status_history_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.candidate_status_history
    ADD CONSTRAINT candidate_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5845 (class 2606 OID 31397)
-- Name: communication_delivery_events communication_delivery_events_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_delivery_events
    ADD CONSTRAINT communication_delivery_events_pkey PRIMARY KEY (id);


--
-- TOC entry 5837 (class 2606 OID 31358)
-- Name: communication_recipients communication_recipients_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_recipients
    ADD CONSTRAINT communication_recipients_pkey PRIMARY KEY (id);


--
-- TOC entry 5821 (class 2606 OID 31259)
-- Name: communication_templates communication_templates_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_templates
    ADD CONSTRAINT communication_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 5828 (class 2606 OID 31297)
-- Name: communications communications_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communications
    ADD CONSTRAINT communications_pkey PRIMARY KEY (id);


--
-- TOC entry 5713 (class 2606 OID 30603)
-- Name: consent_history consent_history_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consent_history
    ADD CONSTRAINT consent_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5698 (class 2606 OID 30513)
-- Name: consent_versions consent_versions_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consent_versions
    ADD CONSTRAINT consent_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 5705 (class 2606 OID 30551)
-- Name: consents consents_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consents
    ADD CONSTRAINT consents_pkey PRIMARY KEY (id);


--
-- TOC entry 5866 (class 2606 OID 31508)
-- Name: document_links document_links_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT document_links_pkey PRIMARY KEY (id);


--
-- TOC entry 5858 (class 2606 OID 31473)
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 5852 (class 2606 OID 31440)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 5729 (class 2606 OID 30696)
-- Name: enrollment_status_history enrollment_status_history_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.enrollment_status_history
    ADD CONSTRAINT enrollment_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5884 (class 2606 OID 31611)
-- Name: entity_change_history entity_change_history_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.entity_change_history
    ADD CONSTRAINT entity_change_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5909 (class 2606 OID 31729)
-- Name: external_system_links external_system_links_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.external_system_links
    ADD CONSTRAINT external_system_links_pkey PRIMARY KEY (id);


--
-- TOC entry 5507 (class 2606 OID 29377)
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- TOC entry 5927 (class 2606 OID 31797)
-- Name: integration_event_attempts integration_event_attempts_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.integration_event_attempts
    ADD CONSTRAINT integration_event_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 5918 (class 2606 OID 31764)
-- Name: integration_events integration_events_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.integration_events
    ADD CONSTRAINT integration_events_pkey PRIMARY KEY (id);


--
-- TOC entry 5903 (class 2606 OID 31691)
-- Name: outbox_event_attempts outbox_event_attempts_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.outbox_event_attempts
    ADD CONSTRAINT outbox_event_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 5896 (class 2606 OID 31658)
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);


--
-- TOC entry 5634 (class 2606 OID 30143)
-- Name: participant_addresses participant_addresses_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_addresses
    ADD CONSTRAINT participant_addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 5626 (class 2606 OID 30104)
-- Name: participant_contacts participant_contacts_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_contacts
    ADD CONSTRAINT participant_contacts_pkey PRIMARY KEY (id);


--
-- TOC entry 5617 (class 2606 OID 30065)
-- Name: participant_identifiers participant_identifiers_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_identifiers
    ADD CONSTRAINT participant_identifiers_pkey PRIMARY KEY (id);


--
-- TOC entry 5639 (class 2606 OID 30180)
-- Name: participant_preferences participant_preferences_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_preferences
    ADD CONSTRAINT participant_preferences_pkey PRIMARY KEY (participant_id);


--
-- TOC entry 5658 (class 2606 OID 30268)
-- Name: participant_referrals participant_referrals_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_referrals
    ADD CONSTRAINT participant_referrals_pkey PRIMARY KEY (id);


--
-- TOC entry 5644 (class 2606 OID 30208)
-- Name: participant_status_history participant_status_history_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_status_history
    ADD CONSTRAINT participant_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5611 (class 2606 OID 30032)
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- TOC entry 5551 (class 2606 OID 29647)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5649 (class 2606 OID 30239)
-- Name: recruitment_sources recruitment_sources_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.recruitment_sources
    ADD CONSTRAINT recruitment_sources_pkey PRIMARY KEY (id);


--
-- TOC entry 5555 (class 2606 OID 29658)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 5547 (class 2606 OID 29632)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5685 (class 2606 OID 30436)
-- Name: screening_answers screening_answers_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_answers
    ADD CONSTRAINT screening_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 5692 (class 2606 OID 30473)
-- Name: screening_outcomes screening_outcomes_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_outcomes
    ADD CONSTRAINT screening_outcomes_pkey PRIMARY KEY (id);


--
-- TOC entry 5678 (class 2606 OID 30399)
-- Name: screening_sessions screening_sessions_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_sessions
    ADD CONSTRAINT screening_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5543 (class 2606 OID 29604)
-- Name: security_settings security_settings_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.security_settings
    ADD CONSTRAINT security_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5515 (class 2606 OID 29456)
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- TOC entry 5582 (class 2606 OID 29835)
-- Name: studies studies_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.studies
    ADD CONSTRAINT studies_pkey PRIMARY KEY (id);


--
-- TOC entry 5665 (class 2606 OID 30314)
-- Name: study_candidates study_candidates_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_candidates
    ADD CONSTRAINT study_candidates_pkey PRIMARY KEY (id);


--
-- TOC entry 5721 (class 2606 OID 30641)
-- Name: study_enrollments study_enrollments_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT study_enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 5600 (class 2606 OID 29941)
-- Name: study_grants study_grants_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_grants
    ADD CONSTRAINT study_grants_pkey PRIMARY KEY (id);


--
-- TOC entry 5597 (class 2606 OID 29913)
-- Name: study_members study_members_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_members
    ADD CONSTRAINT study_members_pkey PRIMARY KEY (study_id, user_id);


--
-- TOC entry 5605 (class 2606 OID 29991)
-- Name: study_milestones study_milestones_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_milestones
    ADD CONSTRAINT study_milestones_pkey PRIMARY KEY (id);


--
-- TOC entry 5602 (class 2606 OID 29966)
-- Name: study_requirements study_requirements_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_requirements
    ADD CONSTRAINT study_requirements_pkey PRIMARY KEY (study_id);


--
-- TOC entry 5590 (class 2606 OID 29858)
-- Name: study_sites study_sites_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_sites
    ADD CONSTRAINT study_sites_pkey PRIMARY KEY (study_id, site_id);


--
-- TOC entry 5780 (class 2606 OID 30978)
-- Name: survey_answers survey_answers_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_answers
    ADD CONSTRAINT survey_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 5766 (class 2606 OID 30876)
-- Name: survey_assignments survey_assignments_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_assignments
    ADD CONSTRAINT survey_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 5736 (class 2606 OID 30727)
-- Name: survey_definitions survey_definitions_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_definitions
    ADD CONSTRAINT survey_definitions_pkey PRIMARY KEY (id);


--
-- TOC entry 5757 (class 2606 OID 30839)
-- Name: survey_question_options survey_question_options_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_question_options
    ADD CONSTRAINT survey_question_options_pkey PRIMARY KEY (id);


--
-- TOC entry 5750 (class 2606 OID 30805)
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_questions
    ADD CONSTRAINT survey_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 5772 (class 2606 OID 30938)
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 5743 (class 2606 OID 30766)
-- Name: survey_versions survey_versions_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_versions
    ADD CONSTRAINT survey_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 5796 (class 2606 OID 31083)
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 5803 (class 2606 OID 31125)
-- Name: task_status_history task_status_history_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_status_history
    ADD CONSTRAINT task_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5790 (class 2606 OID 31023)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5557 (class 2606 OID 29682)
-- Name: team_memberships team_memberships_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.team_memberships
    ADD CONSTRAINT team_memberships_pkey PRIMARY KEY (id);


--
-- TOC entry 5593 (class 2606 OID 29885)
-- Name: team_studies team_studies_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.team_studies
    ADD CONSTRAINT team_studies_pkey PRIMARY KEY (team_id, study_id);


--
-- TOC entry 5521 (class 2606 OID 29485)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 5510 (class 2606 OID 29436)
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- TOC entry 5882 (class 2606 OID 31580)
-- Name: audit_events uk_audit_events_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.audit_events
    ADD CONSTRAINT uk_audit_events_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5817 (class 2606 OID 31222)
-- Name: calendar_event_attendees uk_calendar_event_attendees_event_user; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_event_attendees
    ADD CONSTRAINT uk_calendar_event_attendees_event_user UNIQUE (tenant_id, calendar_event_id, user_id);


--
-- TOC entry 5819 (class 2606 OID 31220)
-- Name: calendar_event_attendees uk_calendar_event_attendees_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_event_attendees
    ADD CONSTRAINT uk_calendar_event_attendees_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5812 (class 2606 OID 31165)
-- Name: calendar_events uk_calendar_events_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_events
    ADD CONSTRAINT uk_calendar_events_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5674 (class 2606 OID 30364)
-- Name: candidate_status_history uk_candidate_status_history_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.candidate_status_history
    ADD CONSTRAINT uk_candidate_status_history_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5850 (class 2606 OID 31399)
-- Name: communication_delivery_events uk_communication_delivery_events_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_delivery_events
    ADD CONSTRAINT uk_communication_delivery_events_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5841 (class 2606 OID 31362)
-- Name: communication_recipients uk_communication_recipient_value; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_recipients
    ADD CONSTRAINT uk_communication_recipient_value UNIQUE (tenant_id, communication_id, recipient_type, recipient_value);


--
-- TOC entry 5843 (class 2606 OID 31360)
-- Name: communication_recipients uk_communication_recipients_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_recipients
    ADD CONSTRAINT uk_communication_recipients_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5824 (class 2606 OID 31263)
-- Name: communication_templates uk_communication_templates_code; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_templates
    ADD CONSTRAINT uk_communication_templates_code UNIQUE (tenant_id, code);


--
-- TOC entry 5826 (class 2606 OID 31261)
-- Name: communication_templates uk_communication_templates_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_templates
    ADD CONSTRAINT uk_communication_templates_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5835 (class 2606 OID 31299)
-- Name: communications uk_communications_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communications
    ADD CONSTRAINT uk_communications_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5716 (class 2606 OID 30605)
-- Name: consent_history uk_consent_history_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consent_history
    ADD CONSTRAINT uk_consent_history_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5701 (class 2606 OID 30517)
-- Name: consent_versions uk_consent_versions_study_version; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consent_versions
    ADD CONSTRAINT uk_consent_versions_study_version UNIQUE (tenant_id, study_id, version_number);


--
-- TOC entry 5703 (class 2606 OID 30515)
-- Name: consent_versions uk_consent_versions_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consent_versions
    ADD CONSTRAINT uk_consent_versions_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5711 (class 2606 OID 30553)
-- Name: consents uk_consents_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consents
    ADD CONSTRAINT uk_consents_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5873 (class 2606 OID 31510)
-- Name: document_links uk_document_links_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT uk_document_links_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5862 (class 2606 OID 31477)
-- Name: document_versions uk_document_versions_number; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_versions
    ADD CONSTRAINT uk_document_versions_number UNIQUE (tenant_id, document_id, version_number);


--
-- TOC entry 5864 (class 2606 OID 31475)
-- Name: document_versions uk_document_versions_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_versions
    ADD CONSTRAINT uk_document_versions_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5856 (class 2606 OID 31442)
-- Name: documents uk_documents_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.documents
    ADD CONSTRAINT uk_documents_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5732 (class 2606 OID 30698)
-- Name: enrollment_status_history uk_enrollment_status_history_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.enrollment_status_history
    ADD CONSTRAINT uk_enrollment_status_history_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5889 (class 2606 OID 31613)
-- Name: entity_change_history uk_entity_change_history_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.entity_change_history
    ADD CONSTRAINT uk_entity_change_history_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5914 (class 2606 OID 31733)
-- Name: external_system_links uk_external_system_link; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.external_system_links
    ADD CONSTRAINT uk_external_system_link UNIQUE (tenant_id, external_system, entity_type, external_identifier);


--
-- TOC entry 5916 (class 2606 OID 31731)
-- Name: external_system_links uk_external_system_links_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.external_system_links
    ADD CONSTRAINT uk_external_system_links_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5931 (class 2606 OID 31801)
-- Name: integration_event_attempts uk_integration_event_attempt_number; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.integration_event_attempts
    ADD CONSTRAINT uk_integration_event_attempt_number UNIQUE (tenant_id, integration_event_id, attempt_number);


--
-- TOC entry 5933 (class 2606 OID 31799)
-- Name: integration_event_attempts uk_integration_event_attempts_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.integration_event_attempts
    ADD CONSTRAINT uk_integration_event_attempts_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5925 (class 2606 OID 31766)
-- Name: integration_events uk_integration_events_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.integration_events
    ADD CONSTRAINT uk_integration_events_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5905 (class 2606 OID 31695)
-- Name: outbox_event_attempts uk_outbox_event_attempt_number; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.outbox_event_attempts
    ADD CONSTRAINT uk_outbox_event_attempt_number UNIQUE (tenant_id, outbox_event_id, attempt_number);


--
-- TOC entry 5907 (class 2606 OID 31693)
-- Name: outbox_event_attempts uk_outbox_event_attempts_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.outbox_event_attempts
    ADD CONSTRAINT uk_outbox_event_attempts_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5899 (class 2606 OID 31660)
-- Name: outbox_events uk_outbox_events_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.outbox_events
    ADD CONSTRAINT uk_outbox_events_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5637 (class 2606 OID 30145)
-- Name: participant_addresses uk_participant_addresses_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_addresses
    ADD CONSTRAINT uk_participant_addresses_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5629 (class 2606 OID 30108)
-- Name: participant_contacts uk_participant_contact_value; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_contacts
    ADD CONSTRAINT uk_participant_contact_value UNIQUE (tenant_id, participant_id, contact_type, contact_value);


--
-- TOC entry 5631 (class 2606 OID 30106)
-- Name: participant_contacts uk_participant_contacts_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_contacts
    ADD CONSTRAINT uk_participant_contacts_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5619 (class 2606 OID 30069)
-- Name: participant_identifiers uk_participant_identifier; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_identifiers
    ADD CONSTRAINT uk_participant_identifier UNIQUE (tenant_id, identifier_type, identifier_value);


--
-- TOC entry 5622 (class 2606 OID 30067)
-- Name: participant_identifiers uk_participant_identifiers_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_identifiers
    ADD CONSTRAINT uk_participant_identifiers_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5641 (class 2606 OID 30182)
-- Name: participant_preferences uk_participant_preferences_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_preferences
    ADD CONSTRAINT uk_participant_preferences_tenant_id UNIQUE (tenant_id, participant_id);


--
-- TOC entry 5660 (class 2606 OID 30270)
-- Name: participant_referrals uk_participant_referrals_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_referrals
    ADD CONSTRAINT uk_participant_referrals_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5646 (class 2606 OID 30210)
-- Name: participant_status_history uk_participant_status_history_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_status_history
    ADD CONSTRAINT uk_participant_status_history_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5613 (class 2606 OID 30034)
-- Name: participants uk_participants_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participants
    ADD CONSTRAINT uk_participants_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5553 (class 2606 OID 29649)
-- Name: permissions uk_permissions_code; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.permissions
    ADD CONSTRAINT uk_permissions_code UNIQUE (code);


--
-- TOC entry 5651 (class 2606 OID 30243)
-- Name: recruitment_sources uk_recruitment_sources_code; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.recruitment_sources
    ADD CONSTRAINT uk_recruitment_sources_code UNIQUE (tenant_id, code);


--
-- TOC entry 5653 (class 2606 OID 30241)
-- Name: recruitment_sources uk_recruitment_sources_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.recruitment_sources
    ADD CONSTRAINT uk_recruitment_sources_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5549 (class 2606 OID 29634)
-- Name: roles uk_roles_code; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.roles
    ADD CONSTRAINT uk_roles_code UNIQUE (code);


--
-- TOC entry 5687 (class 2606 OID 30440)
-- Name: screening_answers uk_screening_answers_question; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_answers
    ADD CONSTRAINT uk_screening_answers_question UNIQUE (tenant_id, screening_session_id, question_code);


--
-- TOC entry 5689 (class 2606 OID 30438)
-- Name: screening_answers uk_screening_answers_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_answers
    ADD CONSTRAINT uk_screening_answers_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5694 (class 2606 OID 30477)
-- Name: screening_outcomes uk_screening_outcomes_session; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_outcomes
    ADD CONSTRAINT uk_screening_outcomes_session UNIQUE (tenant_id, screening_session_id);


--
-- TOC entry 5696 (class 2606 OID 30475)
-- Name: screening_outcomes uk_screening_outcomes_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_outcomes
    ADD CONSTRAINT uk_screening_outcomes_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5680 (class 2606 OID 30403)
-- Name: screening_sessions uk_screening_sessions_attempt; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_sessions
    ADD CONSTRAINT uk_screening_sessions_attempt UNIQUE (tenant_id, candidate_id, attempt_number);


--
-- TOC entry 5682 (class 2606 OID 30401)
-- Name: screening_sessions uk_screening_sessions_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_sessions
    ADD CONSTRAINT uk_screening_sessions_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5545 (class 2606 OID 29606)
-- Name: security_settings uk_security_settings_tenant; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.security_settings
    ADD CONSTRAINT uk_security_settings_tenant UNIQUE (tenant_id);


--
-- TOC entry 5517 (class 2606 OID 29458)
-- Name: sites uk_sites_tenant_code; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.sites
    ADD CONSTRAINT uk_sites_tenant_code UNIQUE (tenant_id, site_code);


--
-- TOC entry 5519 (class 2606 OID 29460)
-- Name: sites uk_sites_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.sites
    ADD CONSTRAINT uk_sites_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5584 (class 2606 OID 29837)
-- Name: studies uk_studies_tenant_code; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.studies
    ADD CONSTRAINT uk_studies_tenant_code UNIQUE (tenant_id, study_code);


--
-- TOC entry 5586 (class 2606 OID 29839)
-- Name: studies uk_studies_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.studies
    ADD CONSTRAINT uk_studies_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5667 (class 2606 OID 30318)
-- Name: study_candidates uk_study_candidates_participant_study; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_candidates
    ADD CONSTRAINT uk_study_candidates_participant_study UNIQUE (tenant_id, study_id, participant_id);


--
-- TOC entry 5669 (class 2606 OID 30316)
-- Name: study_candidates uk_study_candidates_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_candidates
    ADD CONSTRAINT uk_study_candidates_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5723 (class 2606 OID 30645)
-- Name: study_enrollments uk_study_enrollments_participant_study; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT uk_study_enrollments_participant_study UNIQUE (tenant_id, study_id, participant_id);


--
-- TOC entry 5725 (class 2606 OID 30647)
-- Name: study_enrollments uk_study_enrollments_study_participant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT uk_study_enrollments_study_participant_id UNIQUE (tenant_id, study_id, study_participant_id);


--
-- TOC entry 5727 (class 2606 OID 30643)
-- Name: study_enrollments uk_study_enrollments_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT uk_study_enrollments_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5782 (class 2606 OID 30982)
-- Name: survey_answers uk_survey_answers_response_question; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_answers
    ADD CONSTRAINT uk_survey_answers_response_question UNIQUE (tenant_id, survey_response_id, question_id);


--
-- TOC entry 5784 (class 2606 OID 30980)
-- Name: survey_answers uk_survey_answers_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_answers
    ADD CONSTRAINT uk_survey_answers_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5768 (class 2606 OID 30878)
-- Name: survey_assignments uk_survey_assignments_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_assignments
    ADD CONSTRAINT uk_survey_assignments_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5738 (class 2606 OID 30731)
-- Name: survey_definitions uk_survey_definitions_code; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_definitions
    ADD CONSTRAINT uk_survey_definitions_code UNIQUE (tenant_id, code);


--
-- TOC entry 5740 (class 2606 OID 30729)
-- Name: survey_definitions uk_survey_definitions_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_definitions
    ADD CONSTRAINT uk_survey_definitions_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5759 (class 2606 OID 30841)
-- Name: survey_question_options uk_survey_question_options_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_question_options
    ADD CONSTRAINT uk_survey_question_options_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5761 (class 2606 OID 30843)
-- Name: survey_question_options uk_survey_question_options_value; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_question_options
    ADD CONSTRAINT uk_survey_question_options_value UNIQUE (tenant_id, question_id, option_value);


--
-- TOC entry 5752 (class 2606 OID 30809)
-- Name: survey_questions uk_survey_questions_code; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_questions
    ADD CONSTRAINT uk_survey_questions_code UNIQUE (tenant_id, survey_version_id, question_code);


--
-- TOC entry 5754 (class 2606 OID 30807)
-- Name: survey_questions uk_survey_questions_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_questions
    ADD CONSTRAINT uk_survey_questions_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5774 (class 2606 OID 30942)
-- Name: survey_responses uk_survey_responses_attempt; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_responses
    ADD CONSTRAINT uk_survey_responses_attempt UNIQUE (tenant_id, survey_assignment_id, attempt_number);


--
-- TOC entry 5776 (class 2606 OID 30940)
-- Name: survey_responses uk_survey_responses_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_responses
    ADD CONSTRAINT uk_survey_responses_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5745 (class 2606 OID 30770)
-- Name: survey_versions uk_survey_versions_definition_version; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_versions
    ADD CONSTRAINT uk_survey_versions_definition_version UNIQUE (tenant_id, survey_definition_id, version_number);


--
-- TOC entry 5747 (class 2606 OID 30768)
-- Name: survey_versions uk_survey_versions_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_versions
    ADD CONSTRAINT uk_survey_versions_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5798 (class 2606 OID 31087)
-- Name: task_assignments uk_task_assignments_active_user; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_assignments
    ADD CONSTRAINT uk_task_assignments_active_user UNIQUE (tenant_id, task_id, user_id);


--
-- TOC entry 5800 (class 2606 OID 31085)
-- Name: task_assignments uk_task_assignments_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_assignments
    ADD CONSTRAINT uk_task_assignments_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5805 (class 2606 OID 31127)
-- Name: task_status_history uk_task_status_history_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_status_history
    ADD CONSTRAINT uk_task_status_history_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5792 (class 2606 OID 31025)
-- Name: tasks uk_tasks_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tasks
    ADD CONSTRAINT uk_tasks_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5559 (class 2606 OID 29684)
-- Name: team_memberships uk_team_membership; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.team_memberships
    ADD CONSTRAINT uk_team_membership UNIQUE (tenant_id, team_id, user_id);


--
-- TOC entry 5523 (class 2606 OID 29489)
-- Name: teams uk_teams_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.teams
    ADD CONSTRAINT uk_teams_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5525 (class 2606 OID 29487)
-- Name: teams uk_teams_tenant_name; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.teams
    ADD CONSTRAINT uk_teams_tenant_name UNIQUE (tenant_id, name);


--
-- TOC entry 5512 (class 2606 OID 29438)
-- Name: tenants uk_tenants_code; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tenants
    ADD CONSTRAINT uk_tenants_code UNIQUE (code);


--
-- TOC entry 5573 (class 2606 OID 29778)
-- Name: user_action_tokens uk_user_action_token_hash; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_action_tokens
    ADD CONSTRAINT uk_user_action_token_hash UNIQUE (token_hash);


--
-- TOC entry 5535 (class 2606 OID 29540)
-- Name: user_emails uk_user_emails_tenant_email; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_emails
    ADD CONSTRAINT uk_user_emails_tenant_email UNIQUE (tenant_id, email);


--
-- TOC entry 5537 (class 2606 OID 29542)
-- Name: user_emails uk_user_emails_user_email; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_emails
    ADD CONSTRAINT uk_user_emails_user_email UNIQUE (user_id, email);


--
-- TOC entry 5529 (class 2606 OID 29515)
-- Name: users uk_users_tenant_id; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.users
    ADD CONSTRAINT uk_users_tenant_id UNIQUE (tenant_id, id);


--
-- TOC entry 5575 (class 2606 OID 29776)
-- Name: user_action_tokens user_action_tokens_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_action_tokens
    ADD CONSTRAINT user_action_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 5539 (class 2606 OID 29538)
-- Name: user_emails user_emails_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_emails
    ADD CONSTRAINT user_emails_pkey PRIMARY KEY (id);


--
-- TOC entry 5570 (class 2606 OID 29755)
-- Name: user_password_history user_password_history_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_password_history
    ADD CONSTRAINT user_password_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5567 (class 2606 OID 29714)
-- Name: user_role_assignments user_role_assignments_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_role_assignments
    ADD CONSTRAINT user_role_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 5541 (class 2606 OID 29568)
-- Name: user_security_state user_security_state_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_security_state
    ADD CONSTRAINT user_security_state_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5578 (class 2606 OID 29797)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5531 (class 2606 OID 29513)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5508 (class 1259 OID 29378)
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON enrollnow.flyway_schema_history USING btree (success);


--
-- TOC entry 5876 (class 1259 OID 31593)
-- Name: ix_audit_events_action; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_audit_events_action ON enrollnow.audit_events USING btree (tenant_id, action, occurred_at DESC);


--
-- TOC entry 5877 (class 1259 OID 31592)
-- Name: ix_audit_events_actor; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_audit_events_actor ON enrollnow.audit_events USING btree (tenant_id, actor_user_id, occurred_at DESC);


--
-- TOC entry 5878 (class 1259 OID 31594)
-- Name: ix_audit_events_correlation; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_audit_events_correlation ON enrollnow.audit_events USING btree (tenant_id, correlation_id);


--
-- TOC entry 5879 (class 1259 OID 31591)
-- Name: ix_audit_events_entity; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_audit_events_entity ON enrollnow.audit_events USING btree (tenant_id, entity_type, entity_id, occurred_at DESC);


--
-- TOC entry 5880 (class 1259 OID 31595)
-- Name: ix_audit_events_time; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_audit_events_time ON enrollnow.audit_events USING btree (tenant_id, occurred_at DESC);


--
-- TOC entry 5815 (class 1259 OID 31238)
-- Name: ix_calendar_event_attendees_user; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_calendar_event_attendees_user ON enrollnow.calendar_event_attendees USING btree (tenant_id, user_id, active);


--
-- TOC entry 5808 (class 1259 OID 31197)
-- Name: ix_calendar_events_participant_time; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_calendar_events_participant_time ON enrollnow.calendar_events USING btree (tenant_id, participant_id, start_at);


--
-- TOC entry 5809 (class 1259 OID 31196)
-- Name: ix_calendar_events_study_time; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_calendar_events_study_time ON enrollnow.calendar_events USING btree (tenant_id, study_id, start_at);


--
-- TOC entry 5810 (class 1259 OID 31198)
-- Name: ix_calendar_events_time; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_calendar_events_time ON enrollnow.calendar_events USING btree (tenant_id, start_at, end_at);


--
-- TOC entry 5672 (class 1259 OID 30375)
-- Name: ix_candidate_status_history_candidate; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_candidate_status_history_candidate ON enrollnow.candidate_status_history USING btree (tenant_id, candidate_id, changed_at DESC);


--
-- TOC entry 5846 (class 1259 OID 31415)
-- Name: ix_communication_delivery_events_communication; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communication_delivery_events_communication ON enrollnow.communication_delivery_events USING btree (tenant_id, communication_id, event_at DESC);


--
-- TOC entry 5847 (class 1259 OID 31416)
-- Name: ix_communication_delivery_events_recipient; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communication_delivery_events_recipient ON enrollnow.communication_delivery_events USING btree (tenant_id, recipient_id, event_at DESC);


--
-- TOC entry 5848 (class 1259 OID 31417)
-- Name: ix_communication_delivery_events_type; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communication_delivery_events_type ON enrollnow.communication_delivery_events USING btree (tenant_id, event_type, event_at DESC);


--
-- TOC entry 5838 (class 1259 OID 31378)
-- Name: ix_communication_recipients_communication; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communication_recipients_communication ON enrollnow.communication_recipients USING btree (tenant_id, communication_id);


--
-- TOC entry 5839 (class 1259 OID 31379)
-- Name: ix_communication_recipients_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communication_recipients_participant ON enrollnow.communication_recipients USING btree (tenant_id, participant_id);


--
-- TOC entry 5822 (class 1259 OID 31274)
-- Name: ix_communication_templates_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communication_templates_study ON enrollnow.communication_templates USING btree (tenant_id, study_id, active);


--
-- TOC entry 5829 (class 1259 OID 31337)
-- Name: ix_communications_candidate; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communications_candidate ON enrollnow.communications USING btree (tenant_id, candidate_id, created_at DESC);


--
-- TOC entry 5830 (class 1259 OID 31339)
-- Name: ix_communications_external_message; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communications_external_message ON enrollnow.communications USING btree (tenant_id, external_message_id);


--
-- TOC entry 5831 (class 1259 OID 31335)
-- Name: ix_communications_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communications_participant ON enrollnow.communications USING btree (tenant_id, participant_id, created_at DESC);


--
-- TOC entry 5832 (class 1259 OID 31338)
-- Name: ix_communications_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communications_status ON enrollnow.communications USING btree (tenant_id, status, created_at DESC);


--
-- TOC entry 5833 (class 1259 OID 31336)
-- Name: ix_communications_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_communications_study ON enrollnow.communications USING btree (tenant_id, study_id, created_at DESC);


--
-- TOC entry 5714 (class 1259 OID 30616)
-- Name: ix_consent_history_consent; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_consent_history_consent ON enrollnow.consent_history USING btree (tenant_id, consent_id, changed_at DESC);


--
-- TOC entry 5699 (class 1259 OID 30528)
-- Name: ix_consent_versions_study_active; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_consent_versions_study_active ON enrollnow.consent_versions USING btree (tenant_id, study_id, active);


--
-- TOC entry 5706 (class 1259 OID 30585)
-- Name: ix_consents_candidate; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_consents_candidate ON enrollnow.consents USING btree (tenant_id, candidate_id);


--
-- TOC entry 5707 (class 1259 OID 30584)
-- Name: ix_consents_participant_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_consents_participant_study ON enrollnow.consents USING btree (tenant_id, participant_id, study_id);


--
-- TOC entry 5708 (class 1259 OID 30586)
-- Name: ix_consents_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_consents_status ON enrollnow.consents USING btree (tenant_id, study_id, status);


--
-- TOC entry 5867 (class 1259 OID 31559)
-- Name: ix_document_links_consent; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_document_links_consent ON enrollnow.document_links USING btree (tenant_id, consent_id);


--
-- TOC entry 5868 (class 1259 OID 31556)
-- Name: ix_document_links_document; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_document_links_document ON enrollnow.document_links USING btree (tenant_id, document_id);


--
-- TOC entry 5869 (class 1259 OID 31560)
-- Name: ix_document_links_enrollment; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_document_links_enrollment ON enrollnow.document_links USING btree (tenant_id, enrollment_id);


--
-- TOC entry 5870 (class 1259 OID 31557)
-- Name: ix_document_links_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_document_links_participant ON enrollnow.document_links USING btree (tenant_id, participant_id);


--
-- TOC entry 5871 (class 1259 OID 31558)
-- Name: ix_document_links_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_document_links_study ON enrollnow.document_links USING btree (tenant_id, study_id);


--
-- TOC entry 5859 (class 1259 OID 31493)
-- Name: ix_document_versions_document; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_document_versions_document ON enrollnow.document_versions USING btree (tenant_id, document_id, version_number DESC);


--
-- TOC entry 5860 (class 1259 OID 31494)
-- Name: ix_document_versions_storage_key; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_document_versions_storage_key ON enrollnow.document_versions USING btree (tenant_id, storage_key);


--
-- TOC entry 5853 (class 1259 OID 31454)
-- Name: ix_documents_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_documents_status ON enrollnow.documents USING btree (tenant_id, status);


--
-- TOC entry 5854 (class 1259 OID 31453)
-- Name: ix_documents_type; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_documents_type ON enrollnow.documents USING btree (tenant_id, document_type, active);


--
-- TOC entry 5730 (class 1259 OID 30709)
-- Name: ix_enrollment_status_history_enrollment; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_enrollment_status_history_enrollment ON enrollnow.enrollment_status_history USING btree (tenant_id, enrollment_id, changed_at DESC);


--
-- TOC entry 5885 (class 1259 OID 31624)
-- Name: ix_entity_change_history_audit; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_entity_change_history_audit ON enrollnow.entity_change_history USING btree (tenant_id, audit_event_id);


--
-- TOC entry 5886 (class 1259 OID 31625)
-- Name: ix_entity_change_history_entity; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_entity_change_history_entity ON enrollnow.entity_change_history USING btree (tenant_id, entity_type, entity_id, changed_at DESC);


--
-- TOC entry 5887 (class 1259 OID 31626)
-- Name: ix_entity_change_history_field; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_entity_change_history_field ON enrollnow.entity_change_history USING btree (tenant_id, entity_type, field_name, changed_at DESC);


--
-- TOC entry 5910 (class 1259 OID 31741)
-- Name: ix_external_system_links_active; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_external_system_links_active ON enrollnow.external_system_links USING btree (tenant_id, active);


--
-- TOC entry 5911 (class 1259 OID 31739)
-- Name: ix_external_system_links_entity; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_external_system_links_entity ON enrollnow.external_system_links USING btree (tenant_id, entity_type, entity_id);


--
-- TOC entry 5912 (class 1259 OID 31740)
-- Name: ix_external_system_links_external; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_external_system_links_external ON enrollnow.external_system_links USING btree (tenant_id, external_system, external_identifier);


--
-- TOC entry 5928 (class 1259 OID 31812)
-- Name: ix_integration_event_attempts_event; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_integration_event_attempts_event ON enrollnow.integration_event_attempts USING btree (tenant_id, integration_event_id, attempt_number DESC);


--
-- TOC entry 5929 (class 1259 OID 31813)
-- Name: ix_integration_event_attempts_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_integration_event_attempts_status ON enrollnow.integration_event_attempts USING btree (tenant_id, status, started_at DESC);


--
-- TOC entry 5919 (class 1259 OID 31775)
-- Name: ix_integration_events_correlation; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_integration_events_correlation ON enrollnow.integration_events USING btree (tenant_id, correlation_id);


--
-- TOC entry 5920 (class 1259 OID 31773)
-- Name: ix_integration_events_entity; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_integration_events_entity ON enrollnow.integration_events USING btree (tenant_id, entity_type, entity_id, created_at DESC);


--
-- TOC entry 5921 (class 1259 OID 31774)
-- Name: ix_integration_events_external_event; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_integration_events_external_event ON enrollnow.integration_events USING btree (tenant_id, external_system, external_event_id);


--
-- TOC entry 5922 (class 1259 OID 31776)
-- Name: ix_integration_events_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_integration_events_status ON enrollnow.integration_events USING btree (tenant_id, status, created_at DESC);


--
-- TOC entry 5923 (class 1259 OID 31772)
-- Name: ix_integration_events_system_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_integration_events_system_status ON enrollnow.integration_events USING btree (tenant_id, external_system, status, created_at DESC);


--
-- TOC entry 5900 (class 1259 OID 31706)
-- Name: ix_outbox_event_attempts_event; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_outbox_event_attempts_event ON enrollnow.outbox_event_attempts USING btree (tenant_id, outbox_event_id, attempt_number DESC);


--
-- TOC entry 5901 (class 1259 OID 31707)
-- Name: ix_outbox_event_attempts_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_outbox_event_attempts_status ON enrollnow.outbox_event_attempts USING btree (tenant_id, status, started_at DESC);


--
-- TOC entry 5890 (class 1259 OID 31668)
-- Name: ix_outbox_events_aggregate; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_outbox_events_aggregate ON enrollnow.outbox_events USING btree (tenant_id, aggregate_type, aggregate_id, created_at);


--
-- TOC entry 5891 (class 1259 OID 31670)
-- Name: ix_outbox_events_correlation; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_outbox_events_correlation ON enrollnow.outbox_events USING btree (tenant_id, correlation_id);


--
-- TOC entry 5892 (class 1259 OID 31666)
-- Name: ix_outbox_events_pending; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_outbox_events_pending ON enrollnow.outbox_events USING btree (status, available_at, created_at) WHERE ((status)::text = ANY ((ARRAY['PENDING'::character varying, 'FAILED'::character varying])::text[]));


--
-- TOC entry 5893 (class 1259 OID 31667)
-- Name: ix_outbox_events_tenant_pending; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_outbox_events_tenant_pending ON enrollnow.outbox_events USING btree (tenant_id, status, available_at, created_at);


--
-- TOC entry 5894 (class 1259 OID 31669)
-- Name: ix_outbox_events_type; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_outbox_events_type ON enrollnow.outbox_events USING btree (tenant_id, event_type, created_at);


--
-- TOC entry 5632 (class 1259 OID 30156)
-- Name: ix_participant_addresses_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participant_addresses_participant ON enrollnow.participant_addresses USING btree (tenant_id, participant_id);


--
-- TOC entry 5623 (class 1259 OID 30120)
-- Name: ix_participant_contacts_lookup; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participant_contacts_lookup ON enrollnow.participant_contacts USING btree (tenant_id, contact_type, contact_value);


--
-- TOC entry 5624 (class 1259 OID 30119)
-- Name: ix_participant_contacts_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participant_contacts_participant ON enrollnow.participant_contacts USING btree (tenant_id, participant_id);


--
-- TOC entry 5614 (class 1259 OID 30081)
-- Name: ix_participant_identifiers_lookup; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participant_identifiers_lookup ON enrollnow.participant_identifiers USING btree (tenant_id, identifier_value);


--
-- TOC entry 5615 (class 1259 OID 30080)
-- Name: ix_participant_identifiers_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participant_identifiers_participant ON enrollnow.participant_identifiers USING btree (tenant_id, participant_id);


--
-- TOC entry 5654 (class 1259 OID 30291)
-- Name: ix_participant_referrals_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participant_referrals_participant ON enrollnow.participant_referrals USING btree (tenant_id, participant_id);


--
-- TOC entry 5655 (class 1259 OID 30293)
-- Name: ix_participant_referrals_source; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participant_referrals_source ON enrollnow.participant_referrals USING btree (tenant_id, source_id);


--
-- TOC entry 5656 (class 1259 OID 30292)
-- Name: ix_participant_referrals_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participant_referrals_study ON enrollnow.participant_referrals USING btree (tenant_id, study_id);


--
-- TOC entry 5642 (class 1259 OID 30221)
-- Name: ix_participant_status_history_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participant_status_history_participant ON enrollnow.participant_status_history USING btree (tenant_id, participant_id, changed_at DESC);


--
-- TOC entry 5606 (class 1259 OID 30048)
-- Name: ix_participants_tenant_dob; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participants_tenant_dob ON enrollnow.participants USING btree (tenant_id, date_of_birth);


--
-- TOC entry 5607 (class 1259 OID 30045)
-- Name: ix_participants_tenant_name; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participants_tenant_name ON enrollnow.participants USING btree (tenant_id, last_name, first_name);


--
-- TOC entry 5608 (class 1259 OID 30047)
-- Name: ix_participants_tenant_site; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participants_tenant_site ON enrollnow.participants USING btree (tenant_id, site_id);


--
-- TOC entry 5609 (class 1259 OID 30046)
-- Name: ix_participants_tenant_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_participants_tenant_status ON enrollnow.participants USING btree (tenant_id, status);


--
-- TOC entry 5568 (class 1259 OID 29761)
-- Name: ix_password_history_user_created; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_password_history_user_created ON enrollnow.user_password_history USING btree (tenant_id, user_id, created_at DESC);


--
-- TOC entry 5647 (class 1259 OID 30249)
-- Name: ix_recruitment_sources_active; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_recruitment_sources_active ON enrollnow.recruitment_sources USING btree (tenant_id, active);


--
-- TOC entry 5683 (class 1259 OID 30456)
-- Name: ix_screening_answers_session; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_screening_answers_session ON enrollnow.screening_answers USING btree (tenant_id, screening_session_id);


--
-- TOC entry 5690 (class 1259 OID 30493)
-- Name: ix_screening_outcomes_outcome; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_screening_outcomes_outcome ON enrollnow.screening_outcomes USING btree (tenant_id, outcome);


--
-- TOC entry 5675 (class 1259 OID 30419)
-- Name: ix_screening_sessions_candidate; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_screening_sessions_candidate ON enrollnow.screening_sessions USING btree (tenant_id, candidate_id, started_at DESC);


--
-- TOC entry 5676 (class 1259 OID 30420)
-- Name: ix_screening_sessions_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_screening_sessions_status ON enrollnow.screening_sessions USING btree (tenant_id, status);


--
-- TOC entry 5513 (class 1259 OID 29466)
-- Name: ix_sites_tenant_name; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_sites_tenant_name ON enrollnow.sites USING btree (tenant_id, name);


--
-- TOC entry 5579 (class 1259 OID 29846)
-- Name: ix_studies_dates; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_studies_dates ON enrollnow.studies USING btree (tenant_id, recruitment_start_date, recruitment_end_date);


--
-- TOC entry 5580 (class 1259 OID 29845)
-- Name: ix_studies_tenant_archived; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_studies_tenant_archived ON enrollnow.studies USING btree (tenant_id, archived);


--
-- TOC entry 5661 (class 1259 OID 30346)
-- Name: ix_study_candidates_assignee; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_candidates_assignee ON enrollnow.study_candidates USING btree (tenant_id, assigned_to_user_id);


--
-- TOC entry 5662 (class 1259 OID 30345)
-- Name: ix_study_candidates_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_candidates_participant ON enrollnow.study_candidates USING btree (tenant_id, participant_id);


--
-- TOC entry 5663 (class 1259 OID 30344)
-- Name: ix_study_candidates_study_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_candidates_study_status ON enrollnow.study_candidates USING btree (tenant_id, study_id, status);


--
-- TOC entry 5717 (class 1259 OID 30680)
-- Name: ix_study_enrollments_candidate; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_enrollments_candidate ON enrollnow.study_enrollments USING btree (tenant_id, candidate_id);


--
-- TOC entry 5718 (class 1259 OID 30679)
-- Name: ix_study_enrollments_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_enrollments_participant ON enrollnow.study_enrollments USING btree (tenant_id, participant_id);


--
-- TOC entry 5719 (class 1259 OID 30678)
-- Name: ix_study_enrollments_study_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_enrollments_study_status ON enrollnow.study_enrollments USING btree (tenant_id, study_id, status);


--
-- TOC entry 5598 (class 1259 OID 29952)
-- Name: ix_study_grants_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_grants_study ON enrollnow.study_grants USING btree (tenant_id, study_id);


--
-- TOC entry 5594 (class 1259 OID 29930)
-- Name: ix_study_members_tenant_study_active; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_members_tenant_study_active ON enrollnow.study_members USING btree (tenant_id, study_id, active);


--
-- TOC entry 5595 (class 1259 OID 29929)
-- Name: ix_study_members_tenant_user; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_members_tenant_user ON enrollnow.study_members USING btree (tenant_id, user_id);


--
-- TOC entry 5603 (class 1259 OID 30002)
-- Name: ix_study_milestones_study_date; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_milestones_study_date ON enrollnow.study_milestones USING btree (tenant_id, study_id, milestone_date);


--
-- TOC entry 5587 (class 1259 OID 29874)
-- Name: ix_study_sites_tenant_site; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_sites_tenant_site ON enrollnow.study_sites USING btree (tenant_id, site_id);


--
-- TOC entry 5588 (class 1259 OID 29875)
-- Name: ix_study_sites_tenant_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_study_sites_tenant_study ON enrollnow.study_sites USING btree (tenant_id, study_id);


--
-- TOC entry 5777 (class 1259 OID 30999)
-- Name: ix_survey_answers_question; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_answers_question ON enrollnow.survey_answers USING btree (tenant_id, question_id);


--
-- TOC entry 5778 (class 1259 OID 30998)
-- Name: ix_survey_answers_response; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_answers_response ON enrollnow.survey_answers USING btree (tenant_id, survey_response_id);


--
-- TOC entry 5762 (class 1259 OID 30914)
-- Name: ix_survey_assignments_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_assignments_participant ON enrollnow.survey_assignments USING btree (tenant_id, participant_id, status);


--
-- TOC entry 5763 (class 1259 OID 30915)
-- Name: ix_survey_assignments_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_assignments_study ON enrollnow.survey_assignments USING btree (tenant_id, study_id, status);


--
-- TOC entry 5764 (class 1259 OID 30916)
-- Name: ix_survey_assignments_version; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_assignments_version ON enrollnow.survey_assignments USING btree (tenant_id, survey_version_id);


--
-- TOC entry 5733 (class 1259 OID 30743)
-- Name: ix_survey_definitions_active; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_definitions_active ON enrollnow.survey_definitions USING btree (tenant_id, active);


--
-- TOC entry 5734 (class 1259 OID 30742)
-- Name: ix_survey_definitions_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_definitions_study ON enrollnow.survey_definitions USING btree (tenant_id, study_id);


--
-- TOC entry 5755 (class 1259 OID 30854)
-- Name: ix_survey_question_options_question_order; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_question_options_question_order ON enrollnow.survey_question_options USING btree (tenant_id, question_id, display_order);


--
-- TOC entry 5748 (class 1259 OID 30820)
-- Name: ix_survey_questions_version_order; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_questions_version_order ON enrollnow.survey_questions USING btree (tenant_id, survey_version_id, display_order);


--
-- TOC entry 5769 (class 1259 OID 30958)
-- Name: ix_survey_responses_assignment; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_responses_assignment ON enrollnow.survey_responses USING btree (tenant_id, survey_assignment_id, attempt_number);


--
-- TOC entry 5770 (class 1259 OID 30959)
-- Name: ix_survey_responses_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_responses_status ON enrollnow.survey_responses USING btree (tenant_id, status);


--
-- TOC entry 5741 (class 1259 OID 30781)
-- Name: ix_survey_versions_definition_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_survey_versions_definition_status ON enrollnow.survey_versions USING btree (tenant_id, survey_definition_id, status);


--
-- TOC entry 5793 (class 1259 OID 31109)
-- Name: ix_task_assignments_task; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_task_assignments_task ON enrollnow.task_assignments USING btree (tenant_id, task_id);


--
-- TOC entry 5794 (class 1259 OID 31108)
-- Name: ix_task_assignments_user; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_task_assignments_user ON enrollnow.task_assignments USING btree (tenant_id, user_id, active);


--
-- TOC entry 5801 (class 1259 OID 31138)
-- Name: ix_task_status_history_task; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_task_status_history_task ON enrollnow.task_status_history USING btree (tenant_id, task_id, changed_at DESC);


--
-- TOC entry 5785 (class 1259 OID 31063)
-- Name: ix_tasks_due; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_tasks_due ON enrollnow.tasks USING btree (tenant_id, due_at);


--
-- TOC entry 5786 (class 1259 OID 31062)
-- Name: ix_tasks_participant; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_tasks_participant ON enrollnow.tasks USING btree (tenant_id, participant_id);


--
-- TOC entry 5787 (class 1259 OID 31064)
-- Name: ix_tasks_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_tasks_status ON enrollnow.tasks USING btree (tenant_id, status);


--
-- TOC entry 5788 (class 1259 OID 31061)
-- Name: ix_tasks_study_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_tasks_study_status ON enrollnow.tasks USING btree (tenant_id, study_id, status);


--
-- TOC entry 5591 (class 1259 OID 29901)
-- Name: ix_team_studies_tenant_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_team_studies_tenant_study ON enrollnow.team_studies USING btree (tenant_id, study_id);


--
-- TOC entry 5571 (class 1259 OID 29784)
-- Name: ix_user_action_tokens_user; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_user_action_tokens_user ON enrollnow.user_action_tokens USING btree (tenant_id, user_id, token_type);


--
-- TOC entry 5532 (class 1259 OID 29553)
-- Name: ix_user_emails_user; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_user_emails_user ON enrollnow.user_emails USING btree (tenant_id, user_id);


--
-- TOC entry 5560 (class 1259 OID 29742)
-- Name: ix_user_role_assignments_role; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_user_role_assignments_role ON enrollnow.user_role_assignments USING btree (role_id);


--
-- TOC entry 5561 (class 1259 OID 29743)
-- Name: ix_user_role_assignments_site; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_user_role_assignments_site ON enrollnow.user_role_assignments USING btree (tenant_id, site_id);


--
-- TOC entry 5562 (class 1259 OID 30008)
-- Name: ix_user_role_assignments_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_user_role_assignments_study ON enrollnow.user_role_assignments USING btree (tenant_id, study_id);


--
-- TOC entry 5563 (class 1259 OID 29741)
-- Name: ix_user_role_assignments_team; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_user_role_assignments_team ON enrollnow.user_role_assignments USING btree (tenant_id, team_id);


--
-- TOC entry 5564 (class 1259 OID 29740)
-- Name: ix_user_role_assignments_user; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_user_role_assignments_user ON enrollnow.user_role_assignments USING btree (tenant_id, user_id);


--
-- TOC entry 5576 (class 1259 OID 29803)
-- Name: ix_user_sessions_active; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_user_sessions_active ON enrollnow.user_sessions USING btree (tenant_id, user_id, revoked_at);


--
-- TOC entry 5526 (class 1259 OID 29522)
-- Name: ix_users_tenant_name; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_users_tenant_name ON enrollnow.users USING btree (tenant_id, last_name, first_name);


--
-- TOC entry 5527 (class 1259 OID 29521)
-- Name: ix_users_tenant_status; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE INDEX ix_users_tenant_status ON enrollnow.users USING btree (tenant_id, status);


--
-- TOC entry 5709 (class 1259 OID 30587)
-- Name: uk_consents_one_active_per_participant_study; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE UNIQUE INDEX uk_consents_one_active_per_participant_study ON enrollnow.consents USING btree (tenant_id, participant_id, study_id) WHERE (active = true);


--
-- TOC entry 5897 (class 1259 OID 31671)
-- Name: uk_outbox_events_idempotency; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE UNIQUE INDEX uk_outbox_events_idempotency ON enrollnow.outbox_events USING btree (tenant_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- TOC entry 5635 (class 1259 OID 30157)
-- Name: uk_participant_addresses_one_primary; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE UNIQUE INDEX uk_participant_addresses_one_primary ON enrollnow.participant_addresses USING btree (tenant_id, participant_id) WHERE ((primary_address = true) AND (active = true));


--
-- TOC entry 5627 (class 1259 OID 30121)
-- Name: uk_participant_contact_one_primary_per_type; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE UNIQUE INDEX uk_participant_contact_one_primary_per_type ON enrollnow.participant_contacts USING btree (tenant_id, participant_id, contact_type) WHERE ((primary_contact = true) AND (active = true));


--
-- TOC entry 5620 (class 1259 OID 30082)
-- Name: uk_participant_identifier_one_primary; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE UNIQUE INDEX uk_participant_identifier_one_primary ON enrollnow.participant_identifiers USING btree (tenant_id, participant_id) WHERE ((primary_identifier = true) AND (active = true));


--
-- TOC entry 5533 (class 1259 OID 29554)
-- Name: uk_user_emails_one_primary; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE UNIQUE INDEX uk_user_emails_one_primary ON enrollnow.user_emails USING btree (tenant_id, user_id) WHERE (primary_email = true);


--
-- TOC entry 5565 (class 1259 OID 30010)
-- Name: uk_user_role_assignments_active_site_permission; Type: INDEX; Schema: enrollnow; Owner: postgres
--

CREATE UNIQUE INDEX uk_user_role_assignments_active_site_permission ON enrollnow.user_role_assignments USING btree (tenant_id, user_id, site_id) WHERE ((active = true) AND (site_id IS NOT NULL) AND (team_id IS NULL) AND (study_id IS NULL));


--
-- TOC entry 6106 (class 2620 OID 31628)
-- Name: audit_events trg_audit_events_append_only; Type: TRIGGER; Schema: enrollnow; Owner: postgres
--

CREATE TRIGGER trg_audit_events_append_only BEFORE DELETE OR UPDATE ON enrollnow.audit_events FOR EACH ROW EXECUTE FUNCTION enrollnow.prevent_audit_record_modification();


--
-- TOC entry 6107 (class 2620 OID 31629)
-- Name: entity_change_history trg_entity_change_history_append_only; Type: TRIGGER; Schema: enrollnow; Owner: postgres
--

CREATE TRIGGER trg_entity_change_history_append_only BEFORE DELETE OR UPDATE ON enrollnow.entity_change_history FOR EACH ROW EXECUTE FUNCTION enrollnow.prevent_audit_record_modification();


--
-- TOC entry 6095 (class 2606 OID 31586)
-- Name: audit_events fk_audit_events_actor_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.audit_events
    ADD CONSTRAINT fk_audit_events_actor_tenant FOREIGN KEY (tenant_id, actor_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6096 (class 2606 OID 31581)
-- Name: audit_events fk_audit_events_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.audit_events
    ADD CONSTRAINT fk_audit_events_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6063 (class 2606 OID 31228)
-- Name: calendar_event_attendees fk_calendar_event_attendees_event_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_event_attendees
    ADD CONSTRAINT fk_calendar_event_attendees_event_tenant FOREIGN KEY (tenant_id, calendar_event_id) REFERENCES enrollnow.calendar_events(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6064 (class 2606 OID 31223)
-- Name: calendar_event_attendees fk_calendar_event_attendees_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_event_attendees
    ADD CONSTRAINT fk_calendar_event_attendees_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6065 (class 2606 OID 31233)
-- Name: calendar_event_attendees fk_calendar_event_attendees_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_event_attendees
    ADD CONSTRAINT fk_calendar_event_attendees_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6057 (class 2606 OID 31181)
-- Name: calendar_events fk_calendar_events_candidate_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_events
    ADD CONSTRAINT fk_calendar_events_candidate_tenant FOREIGN KEY (tenant_id, candidate_id) REFERENCES enrollnow.study_candidates(tenant_id, id);


--
-- TOC entry 6058 (class 2606 OID 31186)
-- Name: calendar_events fk_calendar_events_enrollment_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_events
    ADD CONSTRAINT fk_calendar_events_enrollment_tenant FOREIGN KEY (tenant_id, enrollment_id) REFERENCES enrollnow.study_enrollments(tenant_id, id);


--
-- TOC entry 6059 (class 2606 OID 31176)
-- Name: calendar_events fk_calendar_events_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_events
    ADD CONSTRAINT fk_calendar_events_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 6060 (class 2606 OID 31171)
-- Name: calendar_events fk_calendar_events_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_events
    ADD CONSTRAINT fk_calendar_events_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6061 (class 2606 OID 31166)
-- Name: calendar_events fk_calendar_events_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_events
    ADD CONSTRAINT fk_calendar_events_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6062 (class 2606 OID 31191)
-- Name: calendar_events fk_calendar_events_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.calendar_events
    ADD CONSTRAINT fk_calendar_events_user_tenant FOREIGN KEY (tenant_id, created_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 5994 (class 2606 OID 30370)
-- Name: candidate_status_history fk_candidate_status_history_candidate_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.candidate_status_history
    ADD CONSTRAINT fk_candidate_status_history_candidate_tenant FOREIGN KEY (tenant_id, candidate_id) REFERENCES enrollnow.study_candidates(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5995 (class 2606 OID 30365)
-- Name: candidate_status_history fk_candidate_status_history_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.candidate_status_history
    ADD CONSTRAINT fk_candidate_status_history_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6078 (class 2606 OID 31405)
-- Name: communication_delivery_events fk_communication_delivery_events_communication_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_delivery_events
    ADD CONSTRAINT fk_communication_delivery_events_communication_tenant FOREIGN KEY (tenant_id, communication_id) REFERENCES enrollnow.communications(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6079 (class 2606 OID 31410)
-- Name: communication_delivery_events fk_communication_delivery_events_recipient_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_delivery_events
    ADD CONSTRAINT fk_communication_delivery_events_recipient_tenant FOREIGN KEY (tenant_id, recipient_id) REFERENCES enrollnow.communication_recipients(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6080 (class 2606 OID 31400)
-- Name: communication_delivery_events fk_communication_delivery_events_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_delivery_events
    ADD CONSTRAINT fk_communication_delivery_events_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6075 (class 2606 OID 31368)
-- Name: communication_recipients fk_communication_recipients_communication_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_recipients
    ADD CONSTRAINT fk_communication_recipients_communication_tenant FOREIGN KEY (tenant_id, communication_id) REFERENCES enrollnow.communications(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6076 (class 2606 OID 31373)
-- Name: communication_recipients fk_communication_recipients_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_recipients
    ADD CONSTRAINT fk_communication_recipients_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 6077 (class 2606 OID 31363)
-- Name: communication_recipients fk_communication_recipients_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_recipients
    ADD CONSTRAINT fk_communication_recipients_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6066 (class 2606 OID 31269)
-- Name: communication_templates fk_communication_templates_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_templates
    ADD CONSTRAINT fk_communication_templates_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6067 (class 2606 OID 31264)
-- Name: communication_templates fk_communication_templates_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communication_templates
    ADD CONSTRAINT fk_communication_templates_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6068 (class 2606 OID 31315)
-- Name: communications fk_communications_candidate_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communications
    ADD CONSTRAINT fk_communications_candidate_tenant FOREIGN KEY (tenant_id, candidate_id) REFERENCES enrollnow.study_candidates(tenant_id, id);


--
-- TOC entry 6069 (class 2606 OID 31320)
-- Name: communications fk_communications_enrollment_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communications
    ADD CONSTRAINT fk_communications_enrollment_tenant FOREIGN KEY (tenant_id, enrollment_id) REFERENCES enrollnow.study_enrollments(tenant_id, id);


--
-- TOC entry 6070 (class 2606 OID 31310)
-- Name: communications fk_communications_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communications
    ADD CONSTRAINT fk_communications_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 6071 (class 2606 OID 31305)
-- Name: communications fk_communications_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communications
    ADD CONSTRAINT fk_communications_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6072 (class 2606 OID 31325)
-- Name: communications fk_communications_template_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communications
    ADD CONSTRAINT fk_communications_template_tenant FOREIGN KEY (tenant_id, template_id) REFERENCES enrollnow.communication_templates(tenant_id, id);


--
-- TOC entry 6073 (class 2606 OID 31300)
-- Name: communications fk_communications_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communications
    ADD CONSTRAINT fk_communications_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6074 (class 2606 OID 31330)
-- Name: communications fk_communications_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.communications
    ADD CONSTRAINT fk_communications_user_tenant FOREIGN KEY (tenant_id, initiated_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6013 (class 2606 OID 30611)
-- Name: consent_history fk_consent_history_consent_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consent_history
    ADD CONSTRAINT fk_consent_history_consent_tenant FOREIGN KEY (tenant_id, consent_id) REFERENCES enrollnow.consents(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6014 (class 2606 OID 30606)
-- Name: consent_history fk_consent_history_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consent_history
    ADD CONSTRAINT fk_consent_history_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6005 (class 2606 OID 30523)
-- Name: consent_versions fk_consent_versions_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consent_versions
    ADD CONSTRAINT fk_consent_versions_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6006 (class 2606 OID 30518)
-- Name: consent_versions fk_consent_versions_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consent_versions
    ADD CONSTRAINT fk_consent_versions_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6007 (class 2606 OID 30569)
-- Name: consents fk_consents_candidate_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consents
    ADD CONSTRAINT fk_consents_candidate_tenant FOREIGN KEY (tenant_id, candidate_id) REFERENCES enrollnow.study_candidates(tenant_id, id);


--
-- TOC entry 6008 (class 2606 OID 30564)
-- Name: consents fk_consents_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consents
    ADD CONSTRAINT fk_consents_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 6009 (class 2606 OID 30559)
-- Name: consents fk_consents_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consents
    ADD CONSTRAINT fk_consents_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6010 (class 2606 OID 30554)
-- Name: consents fk_consents_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consents
    ADD CONSTRAINT fk_consents_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6011 (class 2606 OID 30579)
-- Name: consents fk_consents_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consents
    ADD CONSTRAINT fk_consents_user_tenant FOREIGN KEY (tenant_id, consented_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6012 (class 2606 OID 30574)
-- Name: consents fk_consents_version_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.consents
    ADD CONSTRAINT fk_consents_version_tenant FOREIGN KEY (tenant_id, consent_version_id) REFERENCES enrollnow.consent_versions(tenant_id, id);


--
-- TOC entry 6086 (class 2606 OID 31531)
-- Name: document_links fk_document_links_candidate_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT fk_document_links_candidate_tenant FOREIGN KEY (tenant_id, candidate_id) REFERENCES enrollnow.study_candidates(tenant_id, id);


--
-- TOC entry 6087 (class 2606 OID 31546)
-- Name: document_links fk_document_links_communication_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT fk_document_links_communication_tenant FOREIGN KEY (tenant_id, communication_id) REFERENCES enrollnow.communications(tenant_id, id);


--
-- TOC entry 6088 (class 2606 OID 31536)
-- Name: document_links fk_document_links_consent_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT fk_document_links_consent_tenant FOREIGN KEY (tenant_id, consent_id) REFERENCES enrollnow.consents(tenant_id, id);


--
-- TOC entry 6089 (class 2606 OID 31516)
-- Name: document_links fk_document_links_document_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT fk_document_links_document_tenant FOREIGN KEY (tenant_id, document_id) REFERENCES enrollnow.documents(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6090 (class 2606 OID 31541)
-- Name: document_links fk_document_links_enrollment_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT fk_document_links_enrollment_tenant FOREIGN KEY (tenant_id, enrollment_id) REFERENCES enrollnow.study_enrollments(tenant_id, id);


--
-- TOC entry 6091 (class 2606 OID 31526)
-- Name: document_links fk_document_links_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT fk_document_links_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 6092 (class 2606 OID 31521)
-- Name: document_links fk_document_links_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT fk_document_links_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6093 (class 2606 OID 31551)
-- Name: document_links fk_document_links_task_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT fk_document_links_task_tenant FOREIGN KEY (tenant_id, task_id) REFERENCES enrollnow.tasks(tenant_id, id);


--
-- TOC entry 6094 (class 2606 OID 31511)
-- Name: document_links fk_document_links_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_links
    ADD CONSTRAINT fk_document_links_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6083 (class 2606 OID 31483)
-- Name: document_versions fk_document_versions_document_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_versions
    ADD CONSTRAINT fk_document_versions_document_tenant FOREIGN KEY (tenant_id, document_id) REFERENCES enrollnow.documents(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6084 (class 2606 OID 31478)
-- Name: document_versions fk_document_versions_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_versions
    ADD CONSTRAINT fk_document_versions_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6085 (class 2606 OID 31488)
-- Name: document_versions fk_document_versions_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.document_versions
    ADD CONSTRAINT fk_document_versions_user_tenant FOREIGN KEY (tenant_id, uploaded_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6081 (class 2606 OID 31448)
-- Name: documents fk_documents_created_by_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.documents
    ADD CONSTRAINT fk_documents_created_by_user_tenant FOREIGN KEY (tenant_id, created_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6082 (class 2606 OID 31443)
-- Name: documents fk_documents_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.documents
    ADD CONSTRAINT fk_documents_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6021 (class 2606 OID 30704)
-- Name: enrollment_status_history fk_enrollment_status_history_enrollment_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.enrollment_status_history
    ADD CONSTRAINT fk_enrollment_status_history_enrollment_tenant FOREIGN KEY (tenant_id, enrollment_id) REFERENCES enrollnow.study_enrollments(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6022 (class 2606 OID 30699)
-- Name: enrollment_status_history fk_enrollment_status_history_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.enrollment_status_history
    ADD CONSTRAINT fk_enrollment_status_history_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6097 (class 2606 OID 31619)
-- Name: entity_change_history fk_entity_change_history_audit_event_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.entity_change_history
    ADD CONSTRAINT fk_entity_change_history_audit_event_tenant FOREIGN KEY (tenant_id, audit_event_id) REFERENCES enrollnow.audit_events(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6098 (class 2606 OID 31614)
-- Name: entity_change_history fk_entity_change_history_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.entity_change_history
    ADD CONSTRAINT fk_entity_change_history_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6102 (class 2606 OID 31734)
-- Name: external_system_links fk_external_system_links_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.external_system_links
    ADD CONSTRAINT fk_external_system_links_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6104 (class 2606 OID 31807)
-- Name: integration_event_attempts fk_integration_event_attempts_event_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.integration_event_attempts
    ADD CONSTRAINT fk_integration_event_attempts_event_tenant FOREIGN KEY (tenant_id, integration_event_id) REFERENCES enrollnow.integration_events(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6105 (class 2606 OID 31802)
-- Name: integration_event_attempts fk_integration_event_attempts_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.integration_event_attempts
    ADD CONSTRAINT fk_integration_event_attempts_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6103 (class 2606 OID 31767)
-- Name: integration_events fk_integration_events_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.integration_events
    ADD CONSTRAINT fk_integration_events_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6100 (class 2606 OID 31701)
-- Name: outbox_event_attempts fk_outbox_event_attempts_event_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.outbox_event_attempts
    ADD CONSTRAINT fk_outbox_event_attempts_event_tenant FOREIGN KEY (tenant_id, outbox_event_id) REFERENCES enrollnow.outbox_events(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6101 (class 2606 OID 31696)
-- Name: outbox_event_attempts fk_outbox_event_attempts_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.outbox_event_attempts
    ADD CONSTRAINT fk_outbox_event_attempts_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6099 (class 2606 OID 31661)
-- Name: outbox_events fk_outbox_events_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.outbox_events
    ADD CONSTRAINT fk_outbox_events_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5978 (class 2606 OID 30151)
-- Name: participant_addresses fk_participant_addresses_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_addresses
    ADD CONSTRAINT fk_participant_addresses_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5979 (class 2606 OID 30146)
-- Name: participant_addresses fk_participant_addresses_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_addresses
    ADD CONSTRAINT fk_participant_addresses_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5976 (class 2606 OID 30114)
-- Name: participant_contacts fk_participant_contacts_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_contacts
    ADD CONSTRAINT fk_participant_contacts_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5977 (class 2606 OID 30109)
-- Name: participant_contacts fk_participant_contacts_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_contacts
    ADD CONSTRAINT fk_participant_contacts_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5974 (class 2606 OID 30075)
-- Name: participant_identifiers fk_participant_identifiers_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_identifiers
    ADD CONSTRAINT fk_participant_identifiers_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5975 (class 2606 OID 30070)
-- Name: participant_identifiers fk_participant_identifiers_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_identifiers
    ADD CONSTRAINT fk_participant_identifiers_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5980 (class 2606 OID 30188)
-- Name: participant_preferences fk_participant_preferences_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_preferences
    ADD CONSTRAINT fk_participant_preferences_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5981 (class 2606 OID 30183)
-- Name: participant_preferences fk_participant_preferences_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_preferences
    ADD CONSTRAINT fk_participant_preferences_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5985 (class 2606 OID 30276)
-- Name: participant_referrals fk_participant_referrals_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_referrals
    ADD CONSTRAINT fk_participant_referrals_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 5986 (class 2606 OID 30281)
-- Name: participant_referrals fk_participant_referrals_source_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_referrals
    ADD CONSTRAINT fk_participant_referrals_source_tenant FOREIGN KEY (tenant_id, source_id) REFERENCES enrollnow.recruitment_sources(tenant_id, id);


--
-- TOC entry 5987 (class 2606 OID 30286)
-- Name: participant_referrals fk_participant_referrals_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_referrals
    ADD CONSTRAINT fk_participant_referrals_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 5988 (class 2606 OID 30271)
-- Name: participant_referrals fk_participant_referrals_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_referrals
    ADD CONSTRAINT fk_participant_referrals_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5982 (class 2606 OID 30216)
-- Name: participant_status_history fk_participant_status_history_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_status_history
    ADD CONSTRAINT fk_participant_status_history_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5983 (class 2606 OID 30211)
-- Name: participant_status_history fk_participant_status_history_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participant_status_history
    ADD CONSTRAINT fk_participant_status_history_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5972 (class 2606 OID 30040)
-- Name: participants fk_participants_site_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participants
    ADD CONSTRAINT fk_participants_site_tenant FOREIGN KEY (tenant_id, site_id) REFERENCES enrollnow.sites(tenant_id, id);


--
-- TOC entry 5973 (class 2606 OID 30035)
-- Name: participants fk_participants_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.participants
    ADD CONSTRAINT fk_participants_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5953 (class 2606 OID 29756)
-- Name: user_password_history fk_password_history_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_password_history
    ADD CONSTRAINT fk_password_history_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5984 (class 2606 OID 30244)
-- Name: recruitment_sources fk_recruitment_sources_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.recruitment_sources
    ADD CONSTRAINT fk_recruitment_sources_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5942 (class 2606 OID 29664)
-- Name: role_permissions fk_role_permissions_permission; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.role_permissions
    ADD CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES enrollnow.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5943 (class 2606 OID 29659)
-- Name: role_permissions fk_role_permissions_role; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.role_permissions
    ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES enrollnow.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5999 (class 2606 OID 30446)
-- Name: screening_answers fk_screening_answers_session_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_answers
    ADD CONSTRAINT fk_screening_answers_session_tenant FOREIGN KEY (tenant_id, screening_session_id) REFERENCES enrollnow.screening_sessions(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6000 (class 2606 OID 30441)
-- Name: screening_answers fk_screening_answers_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_answers
    ADD CONSTRAINT fk_screening_answers_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6001 (class 2606 OID 30451)
-- Name: screening_answers fk_screening_answers_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_answers
    ADD CONSTRAINT fk_screening_answers_user_tenant FOREIGN KEY (tenant_id, answered_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6002 (class 2606 OID 30483)
-- Name: screening_outcomes fk_screening_outcomes_session_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_outcomes
    ADD CONSTRAINT fk_screening_outcomes_session_tenant FOREIGN KEY (tenant_id, screening_session_id) REFERENCES enrollnow.screening_sessions(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6003 (class 2606 OID 30478)
-- Name: screening_outcomes fk_screening_outcomes_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_outcomes
    ADD CONSTRAINT fk_screening_outcomes_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6004 (class 2606 OID 30488)
-- Name: screening_outcomes fk_screening_outcomes_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_outcomes
    ADD CONSTRAINT fk_screening_outcomes_user_tenant FOREIGN KEY (tenant_id, evaluated_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 5996 (class 2606 OID 30409)
-- Name: screening_sessions fk_screening_sessions_candidate_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_sessions
    ADD CONSTRAINT fk_screening_sessions_candidate_tenant FOREIGN KEY (tenant_id, candidate_id) REFERENCES enrollnow.study_candidates(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5997 (class 2606 OID 30404)
-- Name: screening_sessions fk_screening_sessions_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_sessions
    ADD CONSTRAINT fk_screening_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5998 (class 2606 OID 30414)
-- Name: screening_sessions fk_screening_sessions_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.screening_sessions
    ADD CONSTRAINT fk_screening_sessions_user_tenant FOREIGN KEY (tenant_id, screened_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 5941 (class 2606 OID 29607)
-- Name: security_settings fk_security_settings_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.security_settings
    ADD CONSTRAINT fk_security_settings_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5934 (class 2606 OID 29461)
-- Name: sites fk_sites_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.sites
    ADD CONSTRAINT fk_sites_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5956 (class 2606 OID 29840)
-- Name: studies fk_studies_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.studies
    ADD CONSTRAINT fk_studies_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5989 (class 2606 OID 30339)
-- Name: study_candidates fk_study_candidates_assigned_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_candidates
    ADD CONSTRAINT fk_study_candidates_assigned_user_tenant FOREIGN KEY (tenant_id, assigned_to_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 5990 (class 2606 OID 30329)
-- Name: study_candidates fk_study_candidates_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_candidates
    ADD CONSTRAINT fk_study_candidates_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 5991 (class 2606 OID 30334)
-- Name: study_candidates fk_study_candidates_referral_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_candidates
    ADD CONSTRAINT fk_study_candidates_referral_tenant FOREIGN KEY (tenant_id, referral_id) REFERENCES enrollnow.participant_referrals(tenant_id, id);


--
-- TOC entry 5992 (class 2606 OID 30324)
-- Name: study_candidates fk_study_candidates_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_candidates
    ADD CONSTRAINT fk_study_candidates_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 5993 (class 2606 OID 30319)
-- Name: study_candidates fk_study_candidates_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_candidates
    ADD CONSTRAINT fk_study_candidates_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6015 (class 2606 OID 30663)
-- Name: study_enrollments fk_study_enrollments_candidate_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT fk_study_enrollments_candidate_tenant FOREIGN KEY (tenant_id, candidate_id) REFERENCES enrollnow.study_candidates(tenant_id, id);


--
-- TOC entry 6016 (class 2606 OID 30668)
-- Name: study_enrollments fk_study_enrollments_consent_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT fk_study_enrollments_consent_tenant FOREIGN KEY (tenant_id, consent_id) REFERENCES enrollnow.consents(tenant_id, id);


--
-- TOC entry 6017 (class 2606 OID 30658)
-- Name: study_enrollments fk_study_enrollments_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT fk_study_enrollments_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 6018 (class 2606 OID 30653)
-- Name: study_enrollments fk_study_enrollments_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT fk_study_enrollments_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6019 (class 2606 OID 30648)
-- Name: study_enrollments fk_study_enrollments_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT fk_study_enrollments_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6020 (class 2606 OID 30673)
-- Name: study_enrollments fk_study_enrollments_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_enrollments
    ADD CONSTRAINT fk_study_enrollments_user_tenant FOREIGN KEY (tenant_id, enrolled_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 5966 (class 2606 OID 29947)
-- Name: study_grants fk_study_grants_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_grants
    ADD CONSTRAINT fk_study_grants_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5967 (class 2606 OID 29942)
-- Name: study_grants fk_study_grants_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_grants
    ADD CONSTRAINT fk_study_grants_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5963 (class 2606 OID 29919)
-- Name: study_members fk_study_members_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_members
    ADD CONSTRAINT fk_study_members_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5964 (class 2606 OID 29914)
-- Name: study_members fk_study_members_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_members
    ADD CONSTRAINT fk_study_members_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5965 (class 2606 OID 29924)
-- Name: study_members fk_study_members_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_members
    ADD CONSTRAINT fk_study_members_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5970 (class 2606 OID 29997)
-- Name: study_milestones fk_study_milestones_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_milestones
    ADD CONSTRAINT fk_study_milestones_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5971 (class 2606 OID 29992)
-- Name: study_milestones fk_study_milestones_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_milestones
    ADD CONSTRAINT fk_study_milestones_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5968 (class 2606 OID 29972)
-- Name: study_requirements fk_study_requirements_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_requirements
    ADD CONSTRAINT fk_study_requirements_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5969 (class 2606 OID 29967)
-- Name: study_requirements fk_study_requirements_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_requirements
    ADD CONSTRAINT fk_study_requirements_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5957 (class 2606 OID 29869)
-- Name: study_sites fk_study_sites_site_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_sites
    ADD CONSTRAINT fk_study_sites_site_tenant FOREIGN KEY (tenant_id, site_id) REFERENCES enrollnow.sites(tenant_id, id);


--
-- TOC entry 5958 (class 2606 OID 29864)
-- Name: study_sites fk_study_sites_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_sites
    ADD CONSTRAINT fk_study_sites_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5959 (class 2606 OID 29859)
-- Name: study_sites fk_study_sites_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.study_sites
    ADD CONSTRAINT fk_study_sites_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6041 (class 2606 OID 30993)
-- Name: survey_answers fk_survey_answers_question_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_answers
    ADD CONSTRAINT fk_survey_answers_question_tenant FOREIGN KEY (tenant_id, question_id) REFERENCES enrollnow.survey_questions(tenant_id, id);


--
-- TOC entry 6042 (class 2606 OID 30988)
-- Name: survey_answers fk_survey_answers_response_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_answers
    ADD CONSTRAINT fk_survey_answers_response_tenant FOREIGN KEY (tenant_id, survey_response_id) REFERENCES enrollnow.survey_responses(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6043 (class 2606 OID 30983)
-- Name: survey_answers fk_survey_answers_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_answers
    ADD CONSTRAINT fk_survey_answers_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6031 (class 2606 OID 30899)
-- Name: survey_assignments fk_survey_assignments_candidate_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_assignments
    ADD CONSTRAINT fk_survey_assignments_candidate_tenant FOREIGN KEY (tenant_id, candidate_id) REFERENCES enrollnow.study_candidates(tenant_id, id);


--
-- TOC entry 6032 (class 2606 OID 30904)
-- Name: survey_assignments fk_survey_assignments_enrollment_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_assignments
    ADD CONSTRAINT fk_survey_assignments_enrollment_tenant FOREIGN KEY (tenant_id, enrollment_id) REFERENCES enrollnow.study_enrollments(tenant_id, id);


--
-- TOC entry 6033 (class 2606 OID 30889)
-- Name: survey_assignments fk_survey_assignments_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_assignments
    ADD CONSTRAINT fk_survey_assignments_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 6034 (class 2606 OID 30894)
-- Name: survey_assignments fk_survey_assignments_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_assignments
    ADD CONSTRAINT fk_survey_assignments_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6035 (class 2606 OID 30879)
-- Name: survey_assignments fk_survey_assignments_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_assignments
    ADD CONSTRAINT fk_survey_assignments_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6036 (class 2606 OID 30909)
-- Name: survey_assignments fk_survey_assignments_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_assignments
    ADD CONSTRAINT fk_survey_assignments_user_tenant FOREIGN KEY (tenant_id, assigned_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6037 (class 2606 OID 30884)
-- Name: survey_assignments fk_survey_assignments_version_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_assignments
    ADD CONSTRAINT fk_survey_assignments_version_tenant FOREIGN KEY (tenant_id, survey_version_id) REFERENCES enrollnow.survey_versions(tenant_id, id);


--
-- TOC entry 6023 (class 2606 OID 30737)
-- Name: survey_definitions fk_survey_definitions_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_definitions
    ADD CONSTRAINT fk_survey_definitions_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6024 (class 2606 OID 30732)
-- Name: survey_definitions fk_survey_definitions_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_definitions
    ADD CONSTRAINT fk_survey_definitions_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6029 (class 2606 OID 30849)
-- Name: survey_question_options fk_survey_question_options_question_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_question_options
    ADD CONSTRAINT fk_survey_question_options_question_tenant FOREIGN KEY (tenant_id, question_id) REFERENCES enrollnow.survey_questions(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6030 (class 2606 OID 30844)
-- Name: survey_question_options fk_survey_question_options_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_question_options
    ADD CONSTRAINT fk_survey_question_options_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6027 (class 2606 OID 30810)
-- Name: survey_questions fk_survey_questions_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_questions
    ADD CONSTRAINT fk_survey_questions_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6028 (class 2606 OID 30815)
-- Name: survey_questions fk_survey_questions_version_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_questions
    ADD CONSTRAINT fk_survey_questions_version_tenant FOREIGN KEY (tenant_id, survey_version_id) REFERENCES enrollnow.survey_versions(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6038 (class 2606 OID 30948)
-- Name: survey_responses fk_survey_responses_assignment_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_responses
    ADD CONSTRAINT fk_survey_responses_assignment_tenant FOREIGN KEY (tenant_id, survey_assignment_id) REFERENCES enrollnow.survey_assignments(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6039 (class 2606 OID 30943)
-- Name: survey_responses fk_survey_responses_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_responses
    ADD CONSTRAINT fk_survey_responses_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6040 (class 2606 OID 30953)
-- Name: survey_responses fk_survey_responses_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_responses
    ADD CONSTRAINT fk_survey_responses_user_tenant FOREIGN KEY (tenant_id, entered_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6025 (class 2606 OID 30776)
-- Name: survey_versions fk_survey_versions_definition_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_versions
    ADD CONSTRAINT fk_survey_versions_definition_tenant FOREIGN KEY (tenant_id, survey_definition_id) REFERENCES enrollnow.survey_definitions(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6026 (class 2606 OID 30771)
-- Name: survey_versions fk_survey_versions_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.survey_versions
    ADD CONSTRAINT fk_survey_versions_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6051 (class 2606 OID 31103)
-- Name: task_assignments fk_task_assignments_assigned_by_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_assignments
    ADD CONSTRAINT fk_task_assignments_assigned_by_tenant FOREIGN KEY (tenant_id, assigned_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6052 (class 2606 OID 31093)
-- Name: task_assignments fk_task_assignments_task_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_assignments
    ADD CONSTRAINT fk_task_assignments_task_tenant FOREIGN KEY (tenant_id, task_id) REFERENCES enrollnow.tasks(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6053 (class 2606 OID 31088)
-- Name: task_assignments fk_task_assignments_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_assignments
    ADD CONSTRAINT fk_task_assignments_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6054 (class 2606 OID 31098)
-- Name: task_assignments fk_task_assignments_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_assignments
    ADD CONSTRAINT fk_task_assignments_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6055 (class 2606 OID 31133)
-- Name: task_status_history fk_task_status_history_task_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_status_history
    ADD CONSTRAINT fk_task_status_history_task_tenant FOREIGN KEY (tenant_id, task_id) REFERENCES enrollnow.tasks(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 6056 (class 2606 OID 31128)
-- Name: task_status_history fk_task_status_history_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.task_status_history
    ADD CONSTRAINT fk_task_status_history_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 6044 (class 2606 OID 31041)
-- Name: tasks fk_tasks_candidate_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tasks
    ADD CONSTRAINT fk_tasks_candidate_tenant FOREIGN KEY (tenant_id, candidate_id) REFERENCES enrollnow.study_candidates(tenant_id, id);


--
-- TOC entry 6045 (class 2606 OID 31056)
-- Name: tasks fk_tasks_completed_by_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tasks
    ADD CONSTRAINT fk_tasks_completed_by_user_tenant FOREIGN KEY (tenant_id, completed_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6046 (class 2606 OID 31051)
-- Name: tasks fk_tasks_created_by_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tasks
    ADD CONSTRAINT fk_tasks_created_by_user_tenant FOREIGN KEY (tenant_id, created_by_user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 6047 (class 2606 OID 31046)
-- Name: tasks fk_tasks_enrollment_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tasks
    ADD CONSTRAINT fk_tasks_enrollment_tenant FOREIGN KEY (tenant_id, enrollment_id) REFERENCES enrollnow.study_enrollments(tenant_id, id);


--
-- TOC entry 6048 (class 2606 OID 31036)
-- Name: tasks fk_tasks_participant_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tasks
    ADD CONSTRAINT fk_tasks_participant_tenant FOREIGN KEY (tenant_id, participant_id) REFERENCES enrollnow.participants(tenant_id, id);


--
-- TOC entry 6049 (class 2606 OID 31031)
-- Name: tasks fk_tasks_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tasks
    ADD CONSTRAINT fk_tasks_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 6050 (class 2606 OID 31026)
-- Name: tasks fk_tasks_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.tasks
    ADD CONSTRAINT fk_tasks_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5944 (class 2606 OID 29690)
-- Name: team_memberships fk_team_membership_team_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.team_memberships
    ADD CONSTRAINT fk_team_membership_team_tenant FOREIGN KEY (tenant_id, team_id) REFERENCES enrollnow.teams(tenant_id, id);


--
-- TOC entry 5945 (class 2606 OID 29685)
-- Name: team_memberships fk_team_membership_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.team_memberships
    ADD CONSTRAINT fk_team_membership_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5946 (class 2606 OID 29695)
-- Name: team_memberships fk_team_membership_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.team_memberships
    ADD CONSTRAINT fk_team_membership_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 5960 (class 2606 OID 29896)
-- Name: team_studies fk_team_studies_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.team_studies
    ADD CONSTRAINT fk_team_studies_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5961 (class 2606 OID 29891)
-- Name: team_studies fk_team_studies_team_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.team_studies
    ADD CONSTRAINT fk_team_studies_team_tenant FOREIGN KEY (tenant_id, team_id) REFERENCES enrollnow.teams(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5962 (class 2606 OID 29886)
-- Name: team_studies fk_team_studies_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.team_studies
    ADD CONSTRAINT fk_team_studies_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5935 (class 2606 OID 29490)
-- Name: teams fk_teams_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.teams
    ADD CONSTRAINT fk_teams_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5954 (class 2606 OID 29779)
-- Name: user_action_tokens fk_user_action_token_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_action_tokens
    ADD CONSTRAINT fk_user_action_token_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5937 (class 2606 OID 29543)
-- Name: user_emails fk_user_emails_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_emails
    ADD CONSTRAINT fk_user_emails_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5938 (class 2606 OID 29548)
-- Name: user_emails fk_user_emails_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_emails
    ADD CONSTRAINT fk_user_emails_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 5947 (class 2606 OID 29725)
-- Name: user_role_assignments fk_user_role_assignment_role; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_role_assignments
    ADD CONSTRAINT fk_user_role_assignment_role FOREIGN KEY (role_id) REFERENCES enrollnow.roles(id);


--
-- TOC entry 5948 (class 2606 OID 29730)
-- Name: user_role_assignments fk_user_role_assignment_site_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_role_assignments
    ADD CONSTRAINT fk_user_role_assignment_site_tenant FOREIGN KEY (tenant_id, site_id) REFERENCES enrollnow.sites(tenant_id, id);


--
-- TOC entry 5949 (class 2606 OID 30003)
-- Name: user_role_assignments fk_user_role_assignment_study_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_role_assignments
    ADD CONSTRAINT fk_user_role_assignment_study_tenant FOREIGN KEY (tenant_id, study_id) REFERENCES enrollnow.studies(tenant_id, id);


--
-- TOC entry 5950 (class 2606 OID 29735)
-- Name: user_role_assignments fk_user_role_assignment_team_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_role_assignments
    ADD CONSTRAINT fk_user_role_assignment_team_tenant FOREIGN KEY (tenant_id, team_id) REFERENCES enrollnow.teams(tenant_id, id);


--
-- TOC entry 5951 (class 2606 OID 29715)
-- Name: user_role_assignments fk_user_role_assignment_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_role_assignments
    ADD CONSTRAINT fk_user_role_assignment_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5952 (class 2606 OID 29720)
-- Name: user_role_assignments fk_user_role_assignment_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_role_assignments
    ADD CONSTRAINT fk_user_role_assignment_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 5939 (class 2606 OID 29569)
-- Name: user_security_state fk_user_security_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_security_state
    ADD CONSTRAINT fk_user_security_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


--
-- TOC entry 5940 (class 2606 OID 29574)
-- Name: user_security_state fk_user_security_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_security_state
    ADD CONSTRAINT fk_user_security_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id);


--
-- TOC entry 5955 (class 2606 OID 29798)
-- Name: user_sessions fk_user_sessions_user_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.user_sessions
    ADD CONSTRAINT fk_user_sessions_user_tenant FOREIGN KEY (tenant_id, user_id) REFERENCES enrollnow.users(tenant_id, id) ON DELETE CASCADE;


--
-- TOC entry 5936 (class 2606 OID 29516)
-- Name: users fk_users_tenant; Type: FK CONSTRAINT; Schema: enrollnow; Owner: postgres
--

ALTER TABLE ONLY enrollnow.users
    ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES enrollnow.tenants(id);


-- Completed on 2026-10-19 19:12:08

--
-- PostgreSQL database dump complete
--

\unrestrict FH8aM2rzQdTxCyQ1JjGrGPwoUFKi7QQlFQCcQIxQTGqZFwKQ6cP0Cxfs92QsKNa

