package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.CustomFilterRuleDto;
import com.enrollnow.participant.models.*;
import com.enrollnow.study.models.Study;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class ParticipantSpecifications {

    private static final Pattern MONTH_OR_YEAR_PATTERN = Pattern.compile("(?i)(?:(\\d+(?:\\.\\d+)?)\\s*y(?:ears?)?)?(?:\\s*(\\d+(?:\\.\\d+)?)\\s*m(?:onths?|o)?)?");

    private static final Map<String, Integer> MONTH_NAMES = new HashMap<>();
    static {
        MONTH_NAMES.put("january", 1);
        MONTH_NAMES.put("february", 2);
        MONTH_NAMES.put("march", 3);
        MONTH_NAMES.put("april", 4);
        MONTH_NAMES.put("may", 5);
        MONTH_NAMES.put("june", 6);
        MONTH_NAMES.put("july", 7);
        MONTH_NAMES.put("august", 8);
        MONTH_NAMES.put("september", 9);
        MONTH_NAMES.put("october", 10);
        MONTH_NAMES.put("november", 11);
        MONTH_NAMES.put("december", 12);
    }

    public static Specification<Participant> buildSpecification(
            UUID tenantId,
            UUID siteId,
            String searchTerm,
            String contactFilter,
            String availableFilter,
            List<String> selectedStudies,
            List<CustomFilterRuleDto> customFilters) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Mandatory Tenant Isolation
            predicates.add(cb.equal(root.get("tenantId"), tenantId));

            // 2. Site Scoping
            if (siteId != null) {
                predicates.add(cb.equal(root.get("siteId"), siteId));
            }

            // 3. Search Term (Full Text / Across Name, Phone, Address, Identifiers)
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                String term = "%" + searchTerm.trim().toLowerCase() + "%";
                String rawDigits = searchTerm.replaceAll("[^0-9]", "");
                List<Predicate> searchOr = new ArrayList<>();

                searchOr.add(cb.like(cb.lower(root.get("firstName")), term));
                searchOr.add(cb.like(cb.lower(root.get("lastName")), term));
                Expression<String> fullName = cb.concat(cb.concat(cb.lower(root.get("firstName")), " "), cb.lower(root.get("lastName")));
                searchOr.add(cb.like(fullName, term));

                // Subquery: Contacts (Phone / Email)
                Subquery<UUID> contactSub = query.subquery(UUID.class);
                Root<ParticipantContact> contactRoot = contactSub.from(ParticipantContact.class);
                Predicate contactTermMatch = cb.like(cb.lower(contactRoot.get("contactValue")), term);
                if (!rawDigits.isEmpty()) {
                    contactTermMatch = cb.or(contactTermMatch, cb.like(contactRoot.get("contactValue"), "%" + rawDigits + "%"));
                }
                contactSub.select(contactRoot.get("participantId"))
                        .where(
                                cb.equal(contactRoot.get("tenantId"), tenantId),
                                cb.equal(contactRoot.get("participantId"), root.get("id")),
                                contactTermMatch
                        );
                searchOr.add(cb.exists(contactSub));

                // Subquery: Addresses (City, State, Zip, AddressLine1)
                Subquery<UUID> addressSub = query.subquery(UUID.class);
                Root<ParticipantAddress> addressRoot = addressSub.from(ParticipantAddress.class);
                addressSub.select(addressRoot.get("participantId"))
                        .where(
                                cb.equal(addressRoot.get("tenantId"), tenantId),
                                cb.equal(addressRoot.get("participantId"), root.get("id")),
                                cb.or(
                                        cb.like(cb.lower(addressRoot.get("city")), term),
                                        cb.like(cb.lower(addressRoot.get("stateRegion")), term),
                                        cb.like(cb.lower(addressRoot.get("postalCode")), term),
                                        cb.like(cb.lower(addressRoot.get("addressLine1")), term)
                                )
                        );
                searchOr.add(cb.exists(addressSub));

                // Subquery: Identifiers (GLOBAL_ID / MRN)
                Subquery<UUID> idSub = query.subquery(UUID.class);
                Root<ParticipantIdentifier> idRoot = idSub.from(ParticipantIdentifier.class);
                idSub.select(idRoot.get("participantId"))
                        .where(
                                cb.equal(idRoot.get("tenantId"), tenantId),
                                cb.equal(idRoot.get("participantId"), root.get("id")),
                                cb.like(cb.lower(idRoot.get("identifierValue")), term)
                        );
                searchOr.add(cb.exists(idSub));

                // Custom attributes text
                searchOr.add(cb.like(cb.lower(root.get("customAttributes")), term));

                predicates.add(cb.or(searchOr.toArray(new Predicate[0])));
            }

            // 4. Contactability Filter
            if (contactFilter != null && !contactFilter.equalsIgnoreCase("all") && !contactFilter.equalsIgnoreCase("show_everyone")) {
                Subquery<UUID> prefSub = query.subquery(UUID.class);
                Root<ParticipantPreference> prefRoot = prefSub.from(ParticipantPreference.class);
                prefSub.select(prefRoot.get("participantId"))
                        .where(
                                cb.equal(prefRoot.get("tenantId"), tenantId),
                                cb.equal(prefRoot.get("participantId"), root.get("id")),
                                cb.isTrue(prefRoot.get("doNotContact"))
                        );
                if (contactFilter.equalsIgnoreCase("yes")) {
                    predicates.add(cb.not(cb.exists(prefSub)));
                } else if (contactFilter.equalsIgnoreCase("no")) {
                    predicates.add(cb.exists(prefSub));
                }
            }

            // 5. Availability Filter
            if (availableFilter != null && !availableFilter.equalsIgnoreCase("all") && !availableFilter.equalsIgnoreCase("show_everyone")) {
                Subquery<UUID> blockedSub = query.subquery(UUID.class);
                Root<StudyCandidate> candRoot = blockedSub.from(StudyCandidate.class);
                Root<Study> studyRoot = blockedSub.from(Study.class);
                blockedSub.select(candRoot.get("participantId"))
                        .where(
                                cb.equal(candRoot.get("tenantId"), tenantId),
                                cb.equal(candRoot.get("participantId"), root.get("id")),
                                cb.isTrue(candRoot.get("active")),
                                cb.equal(studyRoot.get("id"), candRoot.get("studyId")),
                                cb.isFalse(studyRoot.get("archived")),
                                cb.isFalse(studyRoot.get("allowParticipationInOtherStudies"))
                        );
                if (availableFilter.equalsIgnoreCase("yes")) {
                    predicates.add(cb.not(cb.exists(blockedSub)));
                } else if (availableFilter.equalsIgnoreCase("no")) {
                    predicates.add(cb.exists(blockedSub));
                }
            }

            // 6. Selected Studies
            if (selectedStudies != null && !selectedStudies.isEmpty()) {
                List<String> lowerStudies = selectedStudies.stream().map(String::toLowerCase).collect(Collectors.toList());
                Subquery<UUID> studySub = query.subquery(UUID.class);
                Root<StudyCandidate> scRoot = studySub.from(StudyCandidate.class);
                Root<Study> sRoot = studySub.from(Study.class);
                studySub.select(scRoot.get("participantId"))
                        .where(
                                cb.equal(scRoot.get("tenantId"), tenantId),
                                cb.equal(scRoot.get("participantId"), root.get("id")),
                                cb.equal(sRoot.get("id"), scRoot.get("studyId")),
                                cb.lower(sRoot.get("name")).in(lowerStudies)
                        );
                predicates.add(cb.exists(studySub));
            }

            // 7. Dynamic Custom Filter Rules
            if (customFilters != null && !customFilters.isEmpty()) {
                for (CustomFilterRuleDto rule : customFilters) {
                    if (rule.getField() == null || rule.getField().isBlank()) continue;
                    Predicate rulePred = buildCustomRulePredicate(rule, root, query, cb, tenantId);
                    if (rulePred != null) {
                        predicates.add(rulePred);
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Predicate buildCustomRulePredicate(
            CustomFilterRuleDto rule,
            Root<Participant> root,
            CriteriaQuery<?> query,
            CriteriaBuilder cb,
            UUID tenantId) {

        String field = rule.getField().toLowerCase().trim();
        String op = normalizeOperator(rule.getOperator());
        List<String> values = rule.getEffectiveValues();
        String rawVal = rule.getValue() != null ? rule.getValue().trim() : "";
        String minVal = rule.getEffectiveMinValue();
        String maxVal = rule.getEffectiveMaxValue();

        // Handle Special No-Value Operators First
        if ("assigned".equals(op)) {
            if (field.startsWith("custom_")) {
                return cb.and(
                        cb.isNotNull(root.get("customAttributes")),
                        cb.notEqual(root.get("customAttributes"), "{}")
                );
            }
            return cb.isNotNull(getFieldExpression(root, field));
        }
        if ("not_assigned".equals(op)) {
            if (field.startsWith("custom_")) {
                return cb.or(
                        cb.isNull(root.get("customAttributes")),
                        cb.equal(root.get("customAttributes"), "{}")
                );
            }
            return cb.isNull(getFieldExpression(root, field));
        }

        switch (field) {
            case "age":
                return buildAgePredicate(op, rawVal, minVal, maxVal, root, cb);

            case "birthmonth":
                return buildBirthMonthPredicate(op, values, rawVal, root, cb);

            case "datecreated":
                return buildDatePredicate(op, rawVal, minVal, maxVal, root.get("createdAt"), cb);

            case "lastcontact":
                return buildDatePredicate(op, rawVal, minVal, maxVal, root.get("updatedAt"), cb);

            case "gender":
            case "sex":
                return buildGenderPredicate(op, values, rawVal, root, cb);

            case "firstname":
            case "first_name":
                return buildStringComparison(op, cb.lower(root.get("firstName")), rawVal, cb);

            case "lastname":
            case "last_name":
                return buildStringComparison(op, cb.lower(root.get("lastName")), rawVal, cb);

            case "status":
                return buildStatusPredicate(op, values, rawVal, root, cb);

            case "city":
                return buildAddressFieldPredicate("city", op, values, rawVal, root, query, cb, tenantId);

            case "state":
                return buildAddressFieldPredicate("stateRegion", op, values, rawVal, root, query, cb, tenantId);

            case "zipcode":
            case "postalcode":
            case "zip":
                return buildAddressFieldPredicate("postalCode", op, values, rawVal, root, query, cb, tenantId);

            case "phone":
            case "phonenumber":
                return buildPhonePredicate(op, rawVal, root, query, cb, tenantId);

            case "tags":
                return buildJsonbArrayPredicate("tags", op, values, rawVal, root, cb);

            case "ethnicity":
                return buildJsonbFieldPredicate("ethnicity", op, values, rawVal, root, cb);

            case "race":
                return buildJsonbFieldPredicate("race", op, values, rawVal, root, cb);

            default:
                if (field.startsWith("custom_")) {
                    return buildCustomAttributePredicate(field, op, rawVal, minVal, maxVal, root, cb);
                }
                return null;
        }
    }

    private static String normalizeOperator(String op) {
        if (op == null) return "equal";
        String lower = op.toLowerCase().trim();
        switch (lower) {
            case "equal to":
            case "equal":
            case "equals":
            case "=":
                return "equal";
            case "not equal to":
            case "not_equal":
            case "not_equals":
            case "!=":
                return "not_equal";
            case "greater than":
            case "greater_than":
            case ">":
                return "greater_than";
            case "less than":
            case "less_than":
            case "<":
                return "less_than";
            case "between":
                return "between";
            case "not between":
            case "not_between":
                return "not_between";
            case "has any value":
            case "assigned":
                return "assigned";
            case "has no value":
            case "not_assigned":
                return "not_assigned";
            case "contains":
                return "contains";
            default:
                return lower;
        }
    }

    private static Path<?> getFieldExpression(Root<Participant> root, String field) {
        switch (field) {
            case "age":
            case "birthmonth":
                return root.get("dateOfBirth");
            case "gender":
            case "sex":
                return root.get("sexAtBirth");
            case "firstname":
            case "first_name":
                return root.get("firstName");
            case "lastname":
            case "last_name":
                return root.get("lastName");
            case "status":
                return root.get("status");
            case "datecreated":
                return root.get("createdAt");
            default:
                return root.get("customAttributes");
        }
    }

    private static Predicate buildAgePredicate(
            String op, String rawVal, String minVal, String maxVal,
            Root<Participant> root, CriteriaBuilder cb) {

        Path<LocalDate> dob = root.get("dateOfBirth");
        LocalDate today = LocalDate.now();

        if ("between".equals(op) || "not_between".equals(op)) {
            double lowYears = parseAge(minVal);
            double highYears = parseAge(maxVal);
            if (lowYears > highYears) {
                double temp = lowYears;
                lowYears = highYears;
                highYears = temp;
            }
            LocalDate upperDate = today.minusDays(Math.round(lowYears * 365.25));
            LocalDate lowerDate = today.minusDays(Math.round((highYears + 1) * 365.25));

            Predicate between = cb.and(
                    cb.isNotNull(dob),
                    cb.lessThanOrEqualTo(dob, upperDate),
                    cb.greaterThan(dob, lowerDate)
            );
            return "between".equals(op) ? between : cb.or(cb.isNull(dob), cb.not(between));
        }

        double ageYears = parseAge(rawVal);
        LocalDate maxDob = today.minusDays(Math.round(ageYears * 365.25));
        LocalDate minDob = today.minusDays(Math.round((ageYears + 1) * 365.25));

        switch (op) {
            case "equal":
                return cb.and(cb.isNotNull(dob), cb.lessThanOrEqualTo(dob, maxDob), cb.greaterThan(dob, minDob));
            case "not_equal":
                return cb.or(cb.isNull(dob), cb.greaterThan(dob, maxDob), cb.lessThanOrEqualTo(dob, minDob));
            case "greater_than":
                return cb.and(cb.isNotNull(dob), cb.lessThanOrEqualTo(dob, minDob));
            case "less_than":
                return cb.and(cb.isNotNull(dob), cb.greaterThan(dob, maxDob));
            default:
                return null;
        }
    }

    private static double parseAge(String val) {
        if (val == null || val.isBlank()) return 0.0;
        String s = val.trim();
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException ignored) {}

        Matcher m = MONTH_OR_YEAR_PATTERN.matcher(s);
        if (m.matches()) {
            double years = 0.0;
            String yGroup = m.group(1);
            String mGroup = m.group(2);
            if (yGroup != null && !yGroup.isBlank()) {
                years += Double.parseDouble(yGroup);
            }
            if (mGroup != null && !mGroup.isBlank()) {
                years += Double.parseDouble(mGroup) / 12.0;
            }
            return years;
        }
        return 0.0;
    }

    private static Predicate buildBirthMonthPredicate(
            String op, List<String> values, String rawVal,
            Root<Participant> root, CriteriaBuilder cb) {

        Path<LocalDate> dob = root.get("dateOfBirth");
        List<Integer> monthNumbers = new ArrayList<>();

        List<String> candidateValues = !values.isEmpty() ? values : (rawVal.isBlank() ? Collections.emptyList() : Arrays.asList(rawVal.split(",")));
        for (String item : candidateValues) {
            String clean = item.trim().toLowerCase();
            if (MONTH_NAMES.containsKey(clean)) {
                monthNumbers.add(MONTH_NAMES.get(clean));
            } else {
                try {
                    int num = Integer.parseInt(clean);
                    if (num >= 1 && num <= 12) monthNumbers.add(num);
                } catch (NumberFormatException ignored) {}
            }
        }

        if (monthNumbers.isEmpty()) return null;

        Expression<Integer> monthExpr = cb.function("month", Integer.class, dob);

        if ("equal".equals(op)) {
            return cb.and(cb.isNotNull(dob), monthExpr.in(monthNumbers));
        } else if ("not_equal".equals(op)) {
            return cb.or(cb.isNull(dob), cb.not(monthExpr.in(monthNumbers)));
        }
        return null;
    }

    private static Predicate buildDatePredicate(
            String op, String rawVal, String minVal, String maxVal,
            Path<OffsetDateTime> datePath, CriteriaBuilder cb) {

        if ("between".equals(op) || "not_between".equals(op)) {
            OffsetDateTime minStart = parseStartOfDay(minVal);
            OffsetDateTime maxEnd = parseEndOfDay(maxVal);
            if (minStart == null || maxEnd == null) return null;
            if (minStart.isAfter(maxEnd)) {
                LocalDate dMin = parseLocalDate(minVal);
                LocalDate dMax = parseLocalDate(maxVal);
                if (dMin != null && dMax != null) {
                    minStart = dMax.atStartOfDay().atOffset(ZoneOffset.UTC);
                    maxEnd = dMin.plusDays(1).atStartOfDay().minusNanos(1).atOffset(ZoneOffset.UTC);
                }
            }

            Predicate between = cb.and(
                    cb.isNotNull(datePath),
                    cb.greaterThanOrEqualTo(datePath, minStart),
                    cb.lessThanOrEqualTo(datePath, maxEnd)
            );
            return "between".equals(op) ? between : cb.or(cb.isNull(datePath), cb.not(between));
        }

        OffsetDateTime start = parseStartOfDay(rawVal);
        OffsetDateTime end = parseEndOfDay(rawVal);
        if (start == null || end == null) return null;

        switch (op) {
            case "equal":
                return cb.and(cb.isNotNull(datePath), cb.greaterThanOrEqualTo(datePath, start), cb.lessThanOrEqualTo(datePath, end));
            case "not_equal":
                return cb.or(cb.isNull(datePath), cb.lessThan(datePath, start), cb.greaterThan(datePath, end));
            case "greater_than":
                return cb.and(cb.isNotNull(datePath), cb.greaterThan(datePath, end));
            case "less_than":
                return cb.and(cb.isNotNull(datePath), cb.lessThan(datePath, start));
            default:
                return null;
        }
    }

    private static OffsetDateTime parseStartOfDay(String val) {
        if (val == null || val.isBlank()) return null;
        LocalDate d = parseLocalDate(val);
        return d != null ? d.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
    }

    private static OffsetDateTime parseEndOfDay(String val) {
        if (val == null || val.isBlank()) return null;
        LocalDate d = parseLocalDate(val);
        return d != null ? d.plusDays(1).atStartOfDay().minusNanos(1).atOffset(ZoneOffset.UTC) : null;
    }

    private static LocalDate parseLocalDate(String val) {
        val = val.trim();
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy")
        );
        for (DateTimeFormatter fmt : formatters) {
            try {
                return LocalDate.parse(val, fmt);
            } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private static Predicate buildGenderPredicate(
            String op, List<String> values, String rawVal,
            Root<Participant> root, CriteriaBuilder cb) {

        List<String> options = !values.isEmpty() ? values : (rawVal.isBlank() ? Collections.emptyList() : Arrays.asList(rawVal.split(",")));
        if (options.isEmpty()) return null;

        List<String> lowerOpts = options.stream().map(String::trim).map(String::toLowerCase).collect(Collectors.toList());

        Expression<String> sexAtBirth = cb.lower(root.get("sexAtBirth"));
        Expression<String> genderId = cb.lower(root.get("genderIdentity"));

        Predicate inSex = sexAtBirth.in(lowerOpts);
        Predicate inGender = genderId.in(lowerOpts);

        if ("equal".equals(op)) {
            return cb.or(inSex, inGender);
        } else if ("not_equal".equals(op)) {
            return cb.and(cb.not(inSex), cb.not(inGender));
        }
        return null;
    }

    private static Predicate buildStatusPredicate(
            String op, List<String> values, String rawVal,
            Root<Participant> root, CriteriaBuilder cb) {

        List<String> options = !values.isEmpty() ? values : (rawVal.isBlank() ? Collections.emptyList() : Arrays.asList(rawVal.split(",")));
        if (options.isEmpty()) return null;

        List<String> upperOpts = options.stream().map(String::trim).map(String::toUpperCase).collect(Collectors.toList());
        Expression<String> statusExpr = cb.upper(root.get("status"));

        if ("equal".equals(op)) {
            return statusExpr.in(upperOpts);
        } else if ("not_equal".equals(op)) {
            return cb.not(statusExpr.in(upperOpts));
        }
        return null;
    }

    private static Predicate buildStringComparison(String op, Expression<String> expr, String targetVal, CriteriaBuilder cb) {
        if (targetVal == null || targetVal.isBlank()) return null;
        String val = targetVal.trim().toLowerCase();

        switch (op) {
            case "equal":
                return cb.equal(expr, val);
            case "not_equal":
                return cb.notEqual(expr, val);
            case "contains":
                return cb.like(expr, "%" + val + "%");
            default:
                return cb.equal(expr, val);
        }
    }

    private static Predicate buildAddressFieldPredicate(
            String addressProperty, String op, List<String> values, String rawVal,
            Root<Participant> root, CriteriaQuery<?> query, CriteriaBuilder cb, UUID tenantId) {

        List<String> options = !values.isEmpty() ? values : (rawVal.isBlank() ? Collections.emptyList() : Arrays.asList(rawVal.split(",")));
        if (options.isEmpty()) return null;

        List<String> lowerOptions = options.stream().map(String::trim).map(String::toLowerCase).collect(Collectors.toList());

        Subquery<UUID> sub = query.subquery(UUID.class);
        Root<ParticipantAddress> addrRoot = sub.from(ParticipantAddress.class);

        if ("contains".equals(op)) {
            List<Predicate> orLikes = new ArrayList<>();
            for (String opt : lowerOptions) {
                orLikes.add(cb.like(cb.lower(addrRoot.get(addressProperty)), "%" + opt + "%"));
            }
            sub.select(addrRoot.get("participantId"))
                    .where(
                            cb.equal(addrRoot.get("tenantId"), tenantId),
                            cb.equal(addrRoot.get("participantId"), root.get("id")),
                            cb.or(orLikes.toArray(new Predicate[0]))
                    );
            return cb.exists(sub);
        }

        sub.select(addrRoot.get("participantId"))
                .where(
                        cb.equal(addrRoot.get("tenantId"), tenantId),
                        cb.equal(addrRoot.get("participantId"), root.get("id")),
                        cb.lower(addrRoot.get(addressProperty)).in(lowerOptions)
                );

        if ("equal".equals(op)) {
            return cb.exists(sub);
        } else if ("not_equal".equals(op)) {
            return cb.not(cb.exists(sub));
        }
        return null;
    }

    private static Predicate buildPhonePredicate(
            String op, String rawVal,
            Root<Participant> root, CriteriaQuery<?> query, CriteriaBuilder cb, UUID tenantId) {

        if (rawVal == null || rawVal.isBlank()) return null;
        String digits = rawVal.replaceAll("[^0-9]", "");
        if (digits.length() < 2) return null;

        Subquery<UUID> sub = query.subquery(UUID.class);
        Root<ParticipantContact> contactRoot = sub.from(ParticipantContact.class);
        sub.select(contactRoot.get("participantId"))
                .where(
                        cb.equal(contactRoot.get("tenantId"), tenantId),
                        cb.equal(contactRoot.get("participantId"), root.get("id")),
                        cb.equal(contactRoot.get("contactType"), "PHONE"),
                        cb.like(contactRoot.get("contactValue"), "%" + digits + "%")
                );

        if ("equal".equals(op)) {
            return cb.exists(sub);
        } else if ("not_equal".equals(op)) {
            return cb.not(cb.exists(sub));
        }
        return null;
    }

    private static Predicate buildJsonbArrayPredicate(
            String arrayName, String op, List<String> values, String rawVal,
            Root<Participant> root, CriteriaBuilder cb) {

        List<String> options = !values.isEmpty() ? values : (rawVal.isBlank() ? Collections.emptyList() : Arrays.asList(rawVal.split(",")));
        if (options.isEmpty()) return null;

        List<Predicate> orPreds = new ArrayList<>();
        for (String opt : options) {
            String term = "%" + opt.trim().toLowerCase() + "%";
            orPreds.add(cb.like(cb.lower(root.get("customAttributes")), term));
        }

        Predicate combined = cb.or(orPreds.toArray(new Predicate[0]));
        return "equal".equals(op) ? combined : cb.not(combined);
    }

    private static Predicate buildJsonbFieldPredicate(
            String fieldName, String op, List<String> values, String rawVal,
            Root<Participant> root, CriteriaBuilder cb) {

        List<String> options = !values.isEmpty() ? values : (rawVal.isBlank() ? Collections.emptyList() : Arrays.asList(rawVal.split(",")));
        if (options.isEmpty()) return null;

        List<Predicate> orPreds = new ArrayList<>();
        for (String opt : options) {
            String term = "%\"" + fieldName.toLowerCase() + "\"%\"" + opt.trim().toLowerCase() + "\"%";
            orPreds.add(cb.like(cb.lower(root.get("customAttributes")), term));
        }

        Predicate combined = cb.or(orPreds.toArray(new Predicate[0]));
        return "equal".equals(op) ? combined : cb.not(combined);
    }

    private static Predicate buildCustomAttributePredicate(
            String customKey, String op, String rawVal, String minVal, String maxVal,
            Root<Participant> root, CriteriaBuilder cb) {

        if (rawVal == null || rawVal.isBlank()) return null;
        String val = "%" + rawVal.trim().toLowerCase() + "%";

        if ("equal".equals(op) || "contains".equals(op)) {
            return cb.like(cb.lower(root.get("customAttributes")), val);
        } else if ("not_equal".equals(op)) {
            return cb.notLike(cb.lower(root.get("customAttributes")), val);
        }
        return null;
    }
}
