package com.enrollnow.participant.repositories.memory;

import com.enrollnow.participant.models.RegistryParticipant;
import com.enrollnow.participant.models.StudyInfo;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

final class InMemoryRegistryData {
    static final UUID DEFAULT_TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    static final UUID STUDY_AUTISM = UUID.fromString("10000000-0000-0000-0000-000000000001");
    static final UUID STUDY_DREXEL = UUID.fromString("10000000-0000-0000-0000-000000000002");
    static final UUID STUDY_DASHBOARD = UUID.fromString("10000000-0000-0000-0000-000000000003");
    static final UUID STATUS_ACTIVE = UUID.fromString("20000000-0000-0000-0000-000000000001");
    static final UUID STATUS_INACTIVE = UUID.fromString("20000000-0000-0000-0000-000000000002");

    private InMemoryRegistryData() {}

    static Map<UUID, RegistryParticipant> sampleParticipants(UUID tenant) {
        Map<UUID, RegistryParticipant> data = new LinkedHashMap<>();
        data.put(UUID.fromString("30000000-0000-0000-0000-000000000001"), participant(
                tenant, "Drexel", "University AJDAI", "G001", "Male", LocalDate.of(1988, 2, 15),
                "Philadelphia", "PA", "19104", true, List.of("Autism", "Registry"),
                List.of(new StudyInfo(STUDY_DREXEL, "ADRC Comm Hour", STATUS_ACTIVE, "Active"),
                        new StudyInfo(STUDY_AUTISM, "Autism Study", STATUS_ACTIVE, "Active"))));
        data.put(UUID.fromString("30000000-0000-0000-0000-000000000002"), participant(
                tenant, "Yihenew", "Abetu", "G002", "Female", LocalDate.of(1994, 7, 20),
                "New York", "NY", "10001", true, List.of("Registry"),
                List.of(new StudyInfo(STUDY_DREXEL, "ADRC Comm Hour", STATUS_ACTIVE, "Active"),
                        new StudyInfo(STUDY_AUTISM, "Autism Study", STATUS_ACTIVE, "Active"))));
        data.put(UUID.fromString("30000000-0000-0000-0000-000000000003"), participant(
                tenant, "Ali", "Adams", "G003", "Female", LocalDate.of(1975, 10, 4),
                "Boston", "MA", "02108", false, List.of("Customer Survey"),
                List.of(new StudyInfo(STUDY_DREXEL, "ADRC Comm Hour", STATUS_ACTIVE, "Active"))));
        data.put(UUID.fromString("30000000-0000-0000-0000-000000000004"), participant(
                tenant, "Jackson", "Adams", "G004", "Male", LocalDate.of(1992, 4, 2),
                "Austin", "TX", "73301", true, List.of(),
                List.of(new StudyInfo(STUDY_DASHBOARD, "Dashboard", STATUS_INACTIVE, "Inactive"))));
        data.put(UUID.fromString("30000000-0000-0000-0000-000000000005"), participant(
                tenant, "Jeneva", "Adams", "G005", "Female", LocalDate.of(1990, 11, 11),
                "Chicago", "IL", "60601", false, List.of("Registry"), List.of()));
        return data;
    }

    private static RegistryParticipant participant(UUID tenant, String first, String last, String global,
                                                  String sex, LocalDate birthday, String city, String state,
                                                  String zip, boolean contactFuture, List<String> tags,
                                                  List<StudyInfo> studies) {
        RegistryParticipant p = new RegistryParticipant();
        p.setId(UUID.randomUUID());
        p.setTenantId(tenant);
        p.setGlobalId(global);
        p.setFirstName(first);
        p.setLastName(last);
        p.setSex(sex);
        p.setBirthday(birthday);
        p.setCity(city);
        p.setState(state);
        p.setZipcode(zip);
        p.setContactForFutureStudies(contactFuture);
        p.setTags(tags);
        p.setStudies(studies);
        p.setInsertedAt(OffsetDateTime.now(ZoneOffset.UTC).minusDays(30));
        p.setPhones(List.of("+1 555 123 4567"));
        p.setEmails(List.of((first + "." + last + "@example.com").toLowerCase()));
        return p;
    }
}
