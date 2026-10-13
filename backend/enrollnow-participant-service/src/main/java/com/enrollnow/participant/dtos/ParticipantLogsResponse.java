package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.List;

public class ParticipantLogsResponse {
    private OffsetDateTime globalLastContactDate;
    private String logType;
    private List<ParticipantLogResponse> logs;

    public OffsetDateTime getGlobalLastContactDate() { return globalLastContactDate; }
    public void setGlobalLastContactDate(OffsetDateTime v) { globalLastContactDate = v; }
    public String getLogType() { return logType; }
    public void setLogType(String v) { logType = v; }
    public List<ParticipantLogResponse> getLogs() { return logs; }
    public void setLogs(List<ParticipantLogResponse> v) { logs = v; }
}
