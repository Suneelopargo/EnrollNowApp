package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.RegistryFilterRequest;
import com.enrollnow.participant.dtos.RegistryParticipantResponse;
import com.enrollnow.participant.dtos.RegistrySearchRequest;
import com.enrollnow.participant.dtos.RegistrySearchResponse;
import com.enrollnow.participant.models.ParticipantVariable;
import com.enrollnow.participant.models.RegistryParticipant;
import com.enrollnow.participant.models.StudyInfo;
import com.enrollnow.participant.repositories.RegistryParticipantRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.Period;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class RegistrySearchService {
    private final RegistryParticipantRepository repository;
    private final RegistryMapper mapper;

    public RegistrySearchService(RegistryParticipantRepository repository, RegistryMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public RegistrySearchResponse search(UUID tenantId, RegistrySearchRequest request) {
        List<RegistryParticipant> all = repository.findAllByTenantId(tenantId);
        List<RegistryParticipant> filtered = all.stream()
                .filter(matchesSearchText(request.getSearchText()))
                .filter(matchesContactFilter(request.getContactForFutureStudies()))
                .filter(matchesAvailability(request.getParticipantAvailability()))
                .filter(p -> !request.isDuplicatesOnly() || isPotentialDuplicate(p, all))
                .filter(p -> request.getFilters() == null || request.getFilters().stream().allMatch(f -> matchesFilter(p, f)))
                .sorted(comparatorFor(request.getSortField(), request.getSortDirection()))
                .toList();

        int page = request.getPage();
        int size = request.getSize();
        int from = Math.min(page * size, filtered.size());
        int to = Math.min(from + size, filtered.size());

        List<RegistryParticipantResponse> content = filtered.subList(from, to).stream()
                .map(participant -> {
                    RegistryParticipantResponse response = mapper.toResponse(participant);

                    response.setAvailableToAddStudy(
                            isParticipantAvailable(participant)
                    );

                    return response;
                })
                .toList();

        return new RegistrySearchResponse(content, page, size, filtered.size());
    }

    private Predicate<RegistryParticipant> matchesSearchText(String searchText) {
        String q = normalize(searchText);
        if (q.isBlank()) return p -> true;
        return p -> contains(p.getFirstName(), q)
                || contains(p.getLastName(), q)
                || contains(p.getFamilyId(), q)
                || contains(p.getGlobalId(), q)
                || contains(p.getTags(), q)
                || contains(p.getEthnicity(), q)
                || contains(p.getRace(), q)
                || contains(p.getCity(), q)
                || contains(p.getState(), q)
                || contains(p.getZipcode(), q)
                || contains(p.getAddress1(), q)
                || contains(p.getAddress2(), q)
                || contains(p.getPhones(), q)
                || p.getStudies().stream().anyMatch(s -> contains(s.getStudyName(), q));
    }

    private Predicate<RegistryParticipant> matchesContactFilter(String value) {
        String filter = normalize(value);
        return switch (filter) {
            case "yes" -> RegistryParticipant::isContactForFutureStudies;
            case "no" -> p -> !p.isContactForFutureStudies();
            default -> p -> true;
        };
    }

    private Predicate<RegistryParticipant> matchesAvailability(String value) {
        String filter = normalize(value);
        if (filter.equals("all") || filter.equals("show_everyone") || filter.isBlank()) return p -> true;
        return p -> {
            boolean available = isParticipantAvailable(p);
            return filter.equals("yes") ? available : !available;
        };
    }

    /** Mirrors the Ripple availability rule: no study, archived study, inactive status,
     * or a study that explicitly permits other-study participation means the participant is available. */
    public boolean isParticipantAvailable(RegistryParticipant participant) {
        if (participant.getStudies() == null || participant.getStudies().isEmpty()) return true;
        return participant.getStudies().stream().noneMatch(s ->
                !s.isStudyArchived()
                        && !s.isStatusIndicatesInactive()
                        && !s.isAllowParticipationInOtherStudies());
    }

    private boolean isPotentialDuplicate(RegistryParticipant participant, List<RegistryParticipant> all) {
        if (participant.getFirstName() == null || participant.getLastName() == null || participant.getBirthday() == null) {
            return false;
        }
        return all.stream().filter(other -> !other.getId().equals(participant.getId()))
                .anyMatch(other -> equalsIgnoreCase(participant.getFirstName(), other.getFirstName())
                        && equalsIgnoreCase(participant.getLastName(), other.getLastName())
                        && participant.getBirthday().equals(other.getBirthday()));
    }

    private boolean matchesFilter(RegistryParticipant p, RegistryFilterRequest filter) {
        if (filter == null || filter.getField() == null || filter.getField().isBlank()) return true;
        String field = normalize(filter.getField());
        String operator = normalizeOperator(filter.getOperator());
        List<String> values = filter.effectiveValues();
        String value = values.isEmpty() ? "" : values.get(0);

        return switch (field) {
            case "age" -> matchNumber(calculateAge(p.getBirthday()), operator, value, filter.getMinValue(), filter.getMaxValue());
            case "gender", "sex" -> matchString(p.getSex(), operator, values);
            case "studies" -> matchStudies(p, operator, values);
            case "tags" -> matchCollection(p.getTags(), operator, values);
            case "ethnicity" -> matchString(p.getEthnicity(), operator, values);
            case "race" -> matchString(p.getRace(), operator, values);
            case "city" -> matchString(p.getCity(), operator, values);
            case "state" -> matchString(p.getState(), operator, values);
            case "zipcode", "zip" -> matchString(p.getZipcode(), operator, values);
            case "phonenumber", "phone" -> matchCollection(p.getPhones(), operator, values);
            case "globalcontact", "lastcontact" -> matchDate(p.getGlobalLastContactDate(), operator, value, filter.getMinValue(), filter.getMaxValue());
            case "datecreated", "created" -> matchDate(p.getInsertedAt(), operator, value, filter.getMinValue(), filter.getMaxValue());
            case "birthmonth" -> matchBirthMonth(p.getBirthday(), operator, value);
            case "firstname" -> matchString(p.getFirstName(), operator, values);
            case "lastname" -> matchString(p.getLastName(), operator, values);
            case "status", "participantstatus" -> matchStatuses(p, operator, values);
            default -> field.startsWith("custom_") ? matchCustomVariable(p, field.substring("custom_".length()), operator, values)
                    : true;
        };
    }

    private boolean matchStudies(RegistryParticipant p, String operator, List<String> values) {
        boolean hasNone = values.stream().anyMatch(v -> "NONE".equalsIgnoreCase(v));
        Set<String> requested = values.stream().filter(v -> !"NONE".equalsIgnoreCase(v)).map(this::normalize).collect(Collectors.toSet());
        boolean hasStudy = p.getStudies().stream().anyMatch(s -> requested.contains(normalize(String.valueOf(s.getStudyId()))) || requested.contains(normalize(s.getStudyName())));
        boolean none = p.getStudies().isEmpty();
        boolean included = hasStudy || (hasNone && none);
        return "not_equal".equals(operator) || "not_equal".equals(normalizeOperator(operator)) ? !included : included;
    }

    private boolean matchStatuses(RegistryParticipant p, String operator, List<String> values) {
        boolean found = p.getStudies().stream().anyMatch(s -> values.stream().anyMatch(v ->
                equalsIgnoreCase(v, String.valueOf(s.getStatusId())) || equalsIgnoreCase(v, s.getStatusName())));
        return "not_equal".equals(operator) ? !found : found;
    }

    private boolean matchCustomVariable(RegistryParticipant p, String variableId, String operator, List<String> values) {
        ParticipantVariable variable = p.getVariables().stream()
                .filter(v -> variableId.equalsIgnoreCase(v.getVariableId()) || variableId.equalsIgnoreCase(v.getId()))
                .findFirst().orElse(null);
        return matchString(variable == null ? null : variable.getValue(), operator, values);
    }

    private boolean matchCollection(List<String> actualValues, String operator, List<String> requested) {
        if (actualValues == null || actualValues.isEmpty()) {
            return "is_empty".equals(operator) || "not_equal".equals(operator);
        }
        return switch (operator) {
            case "equal", "in" -> actualValues.stream().anyMatch(a -> requested.stream().anyMatch(v -> equalsIgnoreCase(a, v) || contains(a, normalize(v))));
            case "not_equal", "not_in" -> actualValues.stream().noneMatch(a -> requested.stream().anyMatch(v -> equalsIgnoreCase(a, v) || contains(a, normalize(v))));
            case "contains" -> actualValues.stream().anyMatch(a -> requested.stream().anyMatch(v -> contains(a, normalize(v))));
            case "does_not_contain" -> actualValues.stream().noneMatch(a -> requested.stream().anyMatch(v -> contains(a, normalize(v))));
            case "is_empty" -> false;
            case "is_not_empty" -> true;
            default -> actualValues.stream().anyMatch(a -> requested.stream().anyMatch(v -> contains(a, normalize(v))));
        };
    }

    private boolean matchString(String actual, String operator, List<String> requested) {
        if (actual == null || actual.isBlank()) return "is_empty".equals(operator) || "not_equal".equals(operator);
        String target = normalize(actual);
        if (requested.isEmpty()) return true;
        return switch (operator) {
            case "equal", "in" -> requested.stream().anyMatch(v -> target.equals(normalize(v)));
            case "not_equal", "not_in" -> requested.stream().noneMatch(v -> target.equals(normalize(v)));
            case "contains" -> requested.stream().anyMatch(v -> target.contains(normalize(v)));
            case "does_not_contain" -> requested.stream().noneMatch(v -> target.contains(normalize(v)));
            case "starts_with" -> requested.stream().anyMatch(v -> target.startsWith(normalize(v)));
            case "ends_with" -> requested.stream().anyMatch(v -> target.endsWith(normalize(v)));
            case "is_empty" -> false;
            case "is_not_empty" -> true;
            default -> target.equals(normalize(requested.get(0)));
        };
    }

    private boolean matchNumber(Integer actual, String operator, String value, String min, String max) {
        if (actual == null) return "is_empty".equals(operator) || "not_equal".equals(operator);
        Double a = actual.doubleValue();
        return switch (operator) {
            case "equal" -> numericEquals(a, value);
            case "not_equal" -> !numericEquals(a, value);
            case "greater_than" -> a > parseDouble(value);
            case "less_than" -> a < parseDouble(value);
            case "between" -> a >= parseDouble(min) && a <= parseDouble(max);
            case "not_between" -> !(a >= parseDouble(min) && a <= parseDouble(max));
            default -> numericEquals(a, value);
        };
    }

    private boolean matchDate(OffsetDateTime actual, String operator, String value, String min, String max) {
        if (actual == null) return "is_empty".equals(operator) || "not_equal".equals(operator);
        OffsetDateTime parsed = parseDateTime(value);
        OffsetDateTime low = parseDateTime(min);
        OffsetDateTime high = parseDateTime(max);
        return switch (operator) {
            case "equal" -> parsed != null && actual.toLocalDate().equals(parsed.toLocalDate());
            case "not_equal" -> parsed == null || !actual.toLocalDate().equals(parsed.toLocalDate());
            case "greater_than" -> parsed != null && actual.isAfter(parsed);
            case "less_than" -> parsed != null && actual.isBefore(parsed);
            case "between" -> low != null && high != null && !actual.isBefore(low) && !actual.isAfter(high);
            case "not_between" -> low == null || high == null || actual.isBefore(low) || actual.isAfter(high);
            case "is_empty" -> false;
            case "is_not_empty" -> true;
            default -> parsed != null && actual.toLocalDate().equals(parsed.toLocalDate());
        };
    }

    private boolean matchBirthMonth(LocalDate birthday, String operator, String value) {
        if (birthday == null) return "is_empty".equals(operator);
        String month = String.valueOf(birthday.getMonthValue());
        String normalizedValue = normalize(value);
        String monthName = birthday.getMonth().name().toLowerCase(Locale.ROOT);
        return "not_equal".equals(operator) ? !month.equals(normalizedValue) && !monthName.startsWith(normalizedValue)
                : month.equals(normalizedValue) || monthName.startsWith(normalizedValue);
    }

    private Comparator<RegistryParticipant> comparatorFor(String field, String direction) {
        Comparator<RegistryParticipant> comparator = switch (normalize(field)) {
            case "name" -> Comparator.comparing(RegistryParticipant::getLastName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                    .thenComparing(RegistryParticipant::getFirstName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "globalcontact", "lastcontact" -> Comparator.comparing(RegistryParticipant::getGlobalLastContactDate, Comparator.nullsLast(Comparator.naturalOrder()));
            case "birthday", "age" -> Comparator.comparing(RegistryParticipant::getBirthday, Comparator.nullsLast(Comparator.naturalOrder()));
            case "datecreated", "created" -> Comparator.comparing(RegistryParticipant::getInsertedAt, Comparator.nullsLast(Comparator.naturalOrder()));
            default -> Comparator.comparing(RegistryParticipant::getLastName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
        };
        return "DESC".equalsIgnoreCase(direction) ? comparator.reversed() : comparator;
    }

    private String normalizeOperator(String operator) {
        if (operator == null) return "equal";
        return operator.trim().toLowerCase(Locale.ROOT)
                .replace(' ', '_')
                .replace('-', '_')
                .replace("equal_to", "equal")
                .replace("not_equal_to", "not_equal")
                .replace("does_not_contain", "does_not_contain")
                .replace("is_not_empty", "is_not_empty");
    }

    private String normalize(String value) { return value == null ? "" : value.trim().toLowerCase(Locale.ROOT); }
    private boolean contains(String value, String query) { return value != null && normalize(value).contains(query); }
    private boolean contains(List<String> values, String query) { return values != null && values.stream().anyMatch(v -> contains(v, query)); }
    private boolean equalsIgnoreCase(String a, String b) { return a != null && b != null && a.equalsIgnoreCase(b); }
    private boolean numericEquals(double actual, String value) { return Double.compare(actual, parseDouble(value)) == 0; }
    private double parseDouble(String value) { try { return Double.parseDouble(value); } catch (Exception e) { return Double.NaN; } }

    private OffsetDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try { return OffsetDateTime.parse(value); }
        catch (DateTimeParseException ignored) {
            try { return LocalDate.parse(value).atStartOfDay().atOffset(ZoneOffset.UTC); }
            catch (DateTimeParseException ignoredAgain) { return null; }
        }
    }

    private int calculateAge(LocalDate birthday) {
        return birthday == null ? -1 : Period.between(birthday, LocalDate.now(ZoneOffset.UTC)).getYears();
    }
}
