package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.ParticipantLogResponse;
import com.enrollnow.participant.dtos.RegistryParticipantResponse;
import com.enrollnow.participant.dtos.SavedRegistrySearchResponse;
import com.enrollnow.participant.dtos.SurveySubmissionResponse;
import com.enrollnow.participant.models.ParticipantLog;
import com.enrollnow.participant.models.RegistryParticipant;
import com.enrollnow.participant.models.SavedRegistrySearch;
import com.enrollnow.participant.models.SurveySubmission;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneOffset;
import java.util.List;

@Component
public class RegistryMapper {
    public RegistryParticipantResponse toResponse(RegistryParticipant p) {
        RegistryParticipantResponse r = new RegistryParticipantResponse();
        r.setId(p.getId());
        r.setGlobalId(p.getGlobalId());
        r.setFirstName(p.getFirstName());
        r.setMiddleName(p.getMiddleName());
        r.setLastName(p.getLastName());
        r.setName(buildName(p));
        r.setSex(p.getSex());
        r.setBirthday(p.getBirthday());
        r.setAge(calculateAge(p.getBirthday()));
        r.setEthnicity(p.getEthnicity());
        r.setRace(p.getRace());
        r.setFamilyId(p.getFamilyId());
        r.setTimezone(p.getTimezone());
        r.setContactForFutureStudies(p.isContactForFutureStudies());
        r.setGlobalLastContactDate(p.getGlobalLastContactDate());
        r.setInsertedAt(p.getInsertedAt());
        r.setCity(p.getCity());
        r.setState(p.getState());
        r.setZipcode(p.getZipcode());
        r.setPhone(p.getPhones() == null || p.getPhones().isEmpty() ? null : p.getPhones().get(0));
        r.setTags(p.getTags());
        r.setStudies(p.getStudies());
        r.setVariables(p.getVariables());
        return r;
    }

    public SavedRegistrySearchResponse toSavedSearchResponse(SavedRegistrySearch search) {
        return new SavedRegistrySearchResponse(search.getId(), search.getName(), search.getSearch(), search.getInsertedAt());
    }

    public ParticipantLogResponse toLogResponse(ParticipantLog log) {
        ParticipantLogResponse r = new ParticipantLogResponse();
        r.setId(log.getId()); r.setType(log.getType()); r.setMessage(log.getMessage());
        r.setUserId(log.getUserId()); r.setUserName(log.getUserName()); r.setTimestamp(log.getTimestamp());
        r.setStatus(log.getStatus()); r.setFileUrl(log.getFileUrl());
        return r;
    }

    public SurveySubmissionResponse toSurveyResponse(SurveySubmission s) {
        SurveySubmissionResponse r = new SurveySubmissionResponse();
        r.setId(s.getId()); r.setParticipantId(s.getParticipantId()); r.setSurveyId(s.getSurveyId());
        r.setStudyId(s.getStudyId()); r.setSurveyName(s.getSurveyName()); r.setStatus(s.getStatus());
        r.setSubmittedAt(s.getSubmittedAt()); r.setSubmittedBy(s.getSubmittedBy());
        return r;
    }

    private String buildName(RegistryParticipant p) {
        return java.util.stream.Stream.of(p.getFirstName(), p.getLastName())
                .filter(v -> v != null && !v.isBlank())
                .reduce((a, b) -> a + " " + b)
                .orElse("");
    }

    private Integer calculateAge(LocalDate birthday) {
        if (birthday == null) return null;
        return Period.between(birthday, LocalDate.now(ZoneOffset.UTC)).getYears();
    }
}
