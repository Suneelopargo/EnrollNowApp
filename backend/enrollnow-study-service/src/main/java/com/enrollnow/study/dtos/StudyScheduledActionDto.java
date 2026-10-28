package com.enrollnow.study.dtos;

import java.util.Map;

public class StudyScheduledActionDto {

    private ActionDetailsDto action;
    private ScheduleInformationDto schedule;

    public StudyScheduledActionDto() {
    }

    public StudyScheduledActionDto(ActionDetailsDto action, ScheduleInformationDto schedule) {
        this.action = action;
        this.schedule = schedule;
    }

    public ActionDetailsDto getAction() {
        return action;
    }

    public void setAction(ActionDetailsDto action) {
        this.action = action;
    }

    public ScheduleInformationDto getSchedule() {
        return schedule;
    }

    public void setSchedule(ScheduleInformationDto schedule) {
        this.schedule = schedule;
    }

    public static class ActionDetailsDto {
        private String actionTriggerStudyId;
        private String actionType; // "email" | "text"
        private String actionTriggerType; // "event" | "variable" | "customVariable"
        private String actionTriggerId;
        private String triggerName;

        public ActionDetailsDto() {
        }

        public String getActionTriggerStudyId() {
            return actionTriggerStudyId;
        }

        public void setActionTriggerStudyId(String actionTriggerStudyId) {
            this.actionTriggerStudyId = actionTriggerStudyId;
        }

        public String getActionType() {
            return actionType;
        }

        public void setActionType(String actionType) {
            this.actionType = actionType;
        }

        public String getActionTriggerType() {
            return actionTriggerType;
        }

        public void setActionTriggerType(String actionTriggerType) {
            this.actionTriggerType = actionTriggerType;
        }

        public String getActionTriggerId() {
            return actionTriggerId;
        }

        public void setActionTriggerId(String actionTriggerId) {
            this.actionTriggerId = actionTriggerId;
        }

        public String getTriggerName() {
            return triggerName;
        }

        public void setTriggerName(String triggerName) {
            this.triggerName = triggerName;
        }
    }

    public static class ScheduleInformationDto {
        private int relativeInterval;
        private String relativeUnit; // "hours" | "days" | "weeks" | "months"
        private String relativeBeforeOrAfter; // "before" | "after"
        private String dateType; // "scheduled" | "actual"

        public ScheduleInformationDto() {
        }

        public int getRelativeInterval() {
            return relativeInterval;
        }

        public void setRelativeInterval(int relativeInterval) {
            this.relativeInterval = relativeInterval;
        }

        public String getRelativeUnit() {
            return relativeUnit;
        }

        public void setRelativeUnit(String relativeUnit) {
            this.relativeUnit = relativeUnit;
        }

        public String getRelativeBeforeOrAfter() {
            return relativeBeforeOrAfter;
        }

        public void setRelativeBeforeOrAfter(String relativeBeforeOrAfter) {
            this.relativeBeforeOrAfter = relativeBeforeOrAfter;
        }

        public String getDateType() {
            return dateType;
        }

        public void setDateType(String dateType) {
            this.dateType = dateType;
        }
    }
}
