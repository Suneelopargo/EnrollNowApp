package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.CustomFilterRuleDto;
import com.enrollnow.participant.models.Participant;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipantSpecificationsTest {

    @Mock private Root<Participant> root;
    @Mock private CriteriaQuery<?> query;
    @Mock private CriteriaBuilder cb;

    @Mock private Path<UUID> tenantIdPath;
    @Mock private Path<UUID> siteIdPath;
    @Mock private Path<String> firstNamePath;
    @Mock private Path<String> lastNamePath;
    @Mock private Path<LocalDate> dobPath;
    @Mock private Path<OffsetDateTime> createdAtPath;
    @Mock private Path<OffsetDateTime> updatedAtPath;
    @Mock private Path<String> sexAtBirthPath;
    @Mock private Path<String> genderIdentityPath;
    @Mock private Path<String> statusPath;
    @Mock private Path<String> customAttributesPath;

    @Mock private Expression<String> lowerExpr;
    @Mock private Expression<Integer> monthExpr;
    @Mock private Predicate mockPredicate;
    @Mock private Subquery<UUID> subquery;
    @Mock private Root<?> subRoot;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID siteId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        lenient().when(root.<UUID>get("tenantId")).thenReturn(tenantIdPath);
        lenient().when(root.<UUID>get("siteId")).thenReturn(siteIdPath);
        lenient().when(root.<String>get("firstName")).thenReturn(firstNamePath);
        lenient().when(root.<String>get("lastName")).thenReturn(lastNamePath);
        lenient().when(root.<LocalDate>get("dateOfBirth")).thenReturn(dobPath);
        lenient().when(root.<OffsetDateTime>get("createdAt")).thenReturn(createdAtPath);
        lenient().when(root.<OffsetDateTime>get("updatedAt")).thenReturn(updatedAtPath);
        lenient().when(root.<String>get("sexAtBirth")).thenReturn(sexAtBirthPath);
        lenient().when(root.<String>get("genderIdentity")).thenReturn(genderIdentityPath);
        lenient().when(root.<String>get("status")).thenReturn(statusPath);
        lenient().when(root.<String>get("customAttributes")).thenReturn(customAttributesPath);

        lenient().when(cb.equal(any(), any())).thenReturn(mockPredicate);
        lenient().when(cb.notEqual(any(), any())).thenReturn(mockPredicate);
        lenient().when(cb.like(any(), anyString())).thenReturn(mockPredicate);
        lenient().when(cb.notLike(any(), anyString())).thenReturn(mockPredicate);
        lenient().when(cb.lessThanOrEqualTo(any(), any(LocalDate.class))).thenReturn(mockPredicate);
        lenient().when(cb.greaterThan(any(), any(LocalDate.class))).thenReturn(mockPredicate);
        lenient().when(cb.greaterThanOrEqualTo(any(), any(OffsetDateTime.class))).thenReturn(mockPredicate);
        lenient().when(cb.lessThanOrEqualTo(any(), any(OffsetDateTime.class))).thenReturn(mockPredicate);
        lenient().when(cb.greaterThan(any(), any(OffsetDateTime.class))).thenReturn(mockPredicate);
        lenient().when(cb.lessThan(any(), any(OffsetDateTime.class))).thenReturn(mockPredicate);
        lenient().when(cb.isNotNull(any())).thenReturn(mockPredicate);
        lenient().when(cb.isNull(any())).thenReturn(mockPredicate);
        lenient().when(cb.isTrue(any())).thenReturn(mockPredicate);
        lenient().when(cb.isFalse(any())).thenReturn(mockPredicate);
        lenient().when(cb.and(any(Predicate[].class))).thenReturn(mockPredicate);
        lenient().when(cb.or(any(Predicate[].class))).thenReturn(mockPredicate);
        lenient().when(cb.not(any(Predicate.class))).thenReturn(mockPredicate);
        lenient().when(cb.lower(any())).thenReturn(lowerExpr);
        lenient().when(cb.upper(any())).thenReturn(lowerExpr);
        lenient().when(cb.concat(any(Expression.class), anyString())).thenReturn(lowerExpr);
        lenient().when(cb.concat(any(Expression.class), any(Expression.class))).thenReturn(lowerExpr);
        lenient().when(cb.exists(any())).thenReturn(mockPredicate);
        lenient().when(cb.literal(any())).thenReturn(mock(Expression.class));
        lenient().when(cb.function(eq("jsonb_path_exists"), eq(Boolean.class), any(), any())).thenReturn(mock(Expression.class));
        lenient().when(cb.disjunction()).thenReturn(mockPredicate);
        lenient().when(cb.function(eq("month"), eq(Integer.class), any())).thenReturn(monthExpr);
        lenient().when(monthExpr.in(anyCollection())).thenReturn(mockPredicate);
        lenient().when(lowerExpr.in(anyCollection())).thenReturn(mockPredicate);

        lenient().doReturn(subquery).when(query).subquery(any());
        lenient().doReturn(subRoot).when(subquery).from(any(Class.class));
        lenient().doReturn(subquery).when(subquery).select(any());
        lenient().doReturn(subquery).when(subquery).where(any(Predicate[].class));
    }

    @Test
    void buildSpecification_enforcesTenantAndSiteIsolation() {
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, siteId, null, "all", "all", null, null
        );

        Predicate result = spec.toPredicate(root, query, cb);
        assertThat(result).isNotNull();
        verify(cb).equal(tenantIdPath, tenantId);
        verify(cb).equal(siteIdPath, siteId);
    }

    @Test
    void buildSpecification_handlesAgeOperators() {
        // Equal
        CustomFilterRuleDto eqRule = new CustomFilterRuleDto("1", "age", "equal to", "35", "");
        Specification<Participant> eqSpec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(eqRule)
        );
        eqSpec.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).lessThanOrEqualTo(eq(dobPath), any(LocalDate.class));
        verify(cb, atLeastOnce()).greaterThan(eq(dobPath), any(LocalDate.class));

        // Between
        CustomFilterRuleDto betweenRule = new CustomFilterRuleDto("2", "age", "between", "", "20", "40", null, "");
        Specification<Participant> betweenSpec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(betweenRule)
        );
        betweenSpec.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).lessThanOrEqualTo(eq(dobPath), any(LocalDate.class));

        // Greater than
        CustomFilterRuleDto gtRule = new CustomFilterRuleDto("3", "age", "greater than", "50", "");
        Specification<Participant> gtSpec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(gtRule)
        );
        gtSpec.toPredicate(root, query, cb);

        // Less than
        CustomFilterRuleDto ltRule = new CustomFilterRuleDto("4", "age", "less than", "18", "");
        Specification<Participant> ltSpec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(ltRule)
        );
        ltSpec.toPredicate(root, query, cb);
    }

    @Test
    void buildSpecification_handlesSemanticAgeStrings() {
        // Semantic: 1y6m
        CustomFilterRuleDto rule = new CustomFilterRuleDto("1", "age", "equal", "1y6m", "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(rule)
        );
        spec.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).lessThanOrEqualTo(eq(dobPath), any(LocalDate.class));
    }

    @Test
    void buildSpecification_handlesBirthMonth() {
        CustomFilterRuleDto monthRule = new CustomFilterRuleDto("1", "birthMonth", "equal to", "March", "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(monthRule)
        );
        spec.toPredicate(root, query, cb);
        verify(cb).function(eq("month"), eq(Integer.class), eq(dobPath));
    }

    @Test
    void buildSpecification_handlesDateCreatedRange() {
        CustomFilterRuleDto dateRule = new CustomFilterRuleDto("1", "dateCreated", "between", "", "2026-01-01", "2026-12-31", null, "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(dateRule)
        );
        spec.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).greaterThanOrEqualTo(eq(createdAtPath), any(OffsetDateTime.class));
        verify(cb, atLeastOnce()).lessThanOrEqualTo(eq(createdAtPath), any(OffsetDateTime.class));
    }

    @Test
    void buildSpecification_handlesGenderMultiSelect() {
        CustomFilterRuleDto genderRule = new CustomFilterRuleDto("1", "gender", "equal to", "", "", "", List.of("Male", "Female"), "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(genderRule)
        );
        spec.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).or(any(), any());
    }

    @Test
    void buildSpecification_handlesStatusMultiSelect() {
        CustomFilterRuleDto statusRule = new CustomFilterRuleDto("1", "status", "equal to", "ACTIVE,ENROLLED", "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(statusRule)
        );
        spec.toPredicate(root, query, cb);
        verify(lowerExpr, atLeastOnce()).in(anyCollection());
    }

    @Test
    void buildSpecification_handlesCustomVariableSpecialOperators() {
        CustomFilterRuleDto assignedRule = new CustomFilterRuleDto("1", "custom_123", "has any value", "", "");
        Specification<Participant> spec1 = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(assignedRule)
        );
        spec1.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).function(eq("jsonb_path_exists"), eq(Boolean.class), eq(customAttributesPath), any());
        verify(cb, atLeastOnce()).isTrue(any());

        CustomFilterRuleDto notAssignedRule = new CustomFilterRuleDto("2", "custom_123", "has no value", "", "");
        Specification<Participant> spec2 = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(notAssignedRule)
        );
        spec2.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).isFalse(any());
    }

    @Test
    void buildSpecification_combinesSearchAndContactability() {
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, "Smith", "yes", "no", List.of("Study A"), Collections.emptyList()
        );
        Predicate result = spec.toPredicate(root, query, cb);
        assertThat(result).isNotNull();
        verify(cb, atLeastOnce()).like(any(), contains("smith"));
    }

    @Test
    void buildSpecification_handlesDateNotBetweenAndReversedDateRange() {
        // Reversed range: min > max (2026-12-31 to 2026-01-01)
        CustomFilterRuleDto reversedDateRule = new CustomFilterRuleDto("1", "dateCreated", "not between", "", "2026-12-31", "2026-01-01", null, "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(reversedDateRule)
        );
        spec.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).greaterThanOrEqualTo(eq(createdAtPath), any(OffsetDateTime.class));
        verify(cb, atLeastOnce()).lessThanOrEqualTo(eq(createdAtPath), any(OffsetDateTime.class));
        verify(cb, atLeastOnce()).not(any(Predicate.class));
    }

    @Test
    void buildSpecification_handlesAddressFieldsWithContainsAndNotEqual() {
        // City contains "Phila"
        CustomFilterRuleDto containsRule = new CustomFilterRuleDto("1", "city", "contains", "Phila", "");
        Specification<Participant> containsSpec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(containsRule)
        );
        containsSpec.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).exists(eq(subquery));

        // State not equal to "NY"
        CustomFilterRuleDto notEqRule = new CustomFilterRuleDto("2", "state", "not equal to", "NY", "");
        Specification<Participant> notEqSpec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(notEqRule)
        );
        notEqSpec.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).not(any(Predicate.class));
    }

    @Test
    void buildSpecification_handlesCustomVariableContainsAndNotEqual() {
        CustomFilterRuleDto containsRule = new CustomFilterRuleDto("1", "custom_notes", "contains", "eligible", "");
        Specification<Participant> spec1 = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(containsRule)
        );
        spec1.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).function(eq("jsonb_path_exists"), eq(Boolean.class), eq(customAttributesPath), any());
        verify(cb, atLeastOnce()).isTrue(any());

        CustomFilterRuleDto notEqualRule = new CustomFilterRuleDto("2", "custom_notes", "not equal to", "ineligible", "");
        Specification<Participant> spec2 = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(notEqualRule)
        );
        spec2.toPredicate(root, query, cb);
        verify(cb, atLeastOnce()).isFalse(any());
    }

    @Test
    void buildSpecification_preventsCrossVariableCollision() {
        // Variable A: "dose" with value "50"
        CustomFilterRuleDto ruleA = new CustomFilterRuleDto("1", "custom_dose", "equal to", "50", "");
        Specification<Participant> specA = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(ruleA)
        );
        specA.toPredicate(root, query, cb);

        verify(cb).literal(argThat(path ->
                path.toString().contains("@.id == \"dose\"") && path.toString().contains("@.value == \"50\"")));

        // Variable B: "dose_mg" with value "500"
        CustomFilterRuleDto ruleB = new CustomFilterRuleDto("2", "custom_dose_mg", "equal to", "500", "");
        Specification<Participant> specB = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(ruleB)
        );
        specB.toPredicate(root, query, cb);

        verify(cb).literal(argThat(path ->
                path.toString().contains("@.id == \"dose_mg\"") && path.toString().contains("@.value == \"500\"")));
    }

    @Test
    void buildSpecification_handlesCustomNumericGreaterThanLessThanBetween() {
        // Numeric Greater Than
        CustomFilterRuleDto gtRule = new CustomFilterRuleDto("1", "custom_heart_rate", "greater than", "70", "");
        Specification<Participant> specGt = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(gtRule)
        );
        specGt.toPredicate(root, query, cb);
        verify(cb).literal(argThat(path ->
                path.toString().contains("@.id == \"heart_rate\"") && path.toString().contains("@.value.double() > 70.0")));

        // Numeric Less Than
        CustomFilterRuleDto ltRule = new CustomFilterRuleDto("2", "custom_heart_rate", "less than", "100", "");
        Specification<Participant> specLt = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(ltRule)
        );
        specLt.toPredicate(root, query, cb);
        verify(cb).literal(argThat(path ->
                path.toString().contains("@.id == \"heart_rate\"") && path.toString().contains("@.value.double() < 100.0")));

        // Numeric Between
        CustomFilterRuleDto betweenRule = new CustomFilterRuleDto("3", "custom_heart_rate", "between", "", "60", "90", null, "");
        Specification<Participant> specBetween = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(betweenRule)
        );
        specBetween.toPredicate(root, query, cb);
        verify(cb).literal(argThat(path ->
                path.toString().contains("@.id == \"heart_rate\"") &&
                path.toString().contains("@.value.double() >= 60.0") &&
                path.toString().contains("@.value.double() <= 90.0")));
    }

    @Test
    void buildSpecification_handlesCustomDateComparisons() {
        CustomFilterRuleDto dateBetweenRule = new CustomFilterRuleDto("1", "custom_exam_date", "between", "", "2026-01-01", "2026-06-30", null, "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(dateBetweenRule)
        );
        spec.toPredicate(root, query, cb);
        verify(cb).literal(argThat(path ->
                path.toString().contains("@.id == \"exam_date\"") &&
                path.toString().contains("@.value >= \"2026-01-01\"") &&
                path.toString().contains("@.value <= \"2026-06-30\"")));
    }

    @Test
    void buildSpecification_handlesCustomCategoricalMultiSelect() {
        CustomFilterRuleDto catRule = new CustomFilterRuleDto("1", "custom_cohort", "equal to", "", "", "", List.of("Alpha", "Beta"), "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(catRule)
        );
        spec.toPredicate(root, query, cb);
        verify(cb).literal(argThat(path ->
                path.toString().contains("@.id == \"cohort\"") &&
                path.toString().contains("@.value == \"Alpha\" || @.value == \"Beta\"")));
    }

    @Test
    void buildSpecification_handlesSafeJsonKeysWithSpecialCharacters() {
        CustomFilterRuleDto specialKeyRule = new CustomFilterRuleDto("1", "custom_bp.systolic/mmHg", "equal to", "120", "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(specialKeyRule)
        );
        spec.toPredicate(root, query, cb);
        verify(cb).literal(argThat(path ->
                path.toString().contains("@.id == \"bp.systolic/mmhg\"") &&
                path.toString().contains("@.value == \"120\"")));
    }

    @Test
    void buildSpecification_unsupportedOrInvalidCustomRuleReturnsDisjunction() {
        // Missing range boundaries on between operator
        CustomFilterRuleDto invalidRule = new CustomFilterRuleDto("1", "custom_var", "between", "", "", "", null, "");
        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, List.of(invalidRule)
        );
        spec.toPredicate(root, query, cb);
        verify(cb).disjunction();
    }

    @Test
    void buildSpecification_withDuplicatesOnly_constructsSubqueryPredicate() {
        Subquery<UUID> mockDupSub = mock(Subquery.class);
        Root<Participant> mockDupRoot = mock(Root.class);
        doReturn(mockDupSub).when(query).subquery(UUID.class);
        doReturn(mockDupRoot).when(mockDupSub).from(Participant.class);
        lenient().when(mockDupSub.select(any())).thenReturn(mockDupSub);
        lenient().when(mockDupSub.where(any(Predicate[].class))).thenReturn(mockDupSub);
        lenient().when(cb.exists(mockDupSub)).thenReturn(mockPredicate);

        Specification<Participant> spec = ParticipantSpecifications.buildSpecification(
                tenantId, null, null, "all", "all", null, null, true
        );
        Predicate pred = spec.toPredicate(root, query, cb);

        assertThat(pred).isNotNull();
        verify(query).subquery(UUID.class);
        verify(cb).exists(mockDupSub);
    }
}
