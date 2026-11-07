package com.enrollnow.notification.quartz;

import org.quartz.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzSchedulerConfig {

    @Value("${app.scheduler.daily-digest.cron:0 59 8 * * ?}")
    private String dailyDigestCron = "0 59 8 * * ?";

    @Value("${app.scheduler.check-locks.cron:0 55 8 * * ?}")
    private String checkLocksCron = "0 55 8 * * ?";

    public void setDailyDigestCron(String dailyDigestCron) {
        this.dailyDigestCron = dailyDigestCron;
    }

    public void setCheckLocksCron(String checkLocksCron) {
        this.checkLocksCron = checkLocksCron;
    }

    @Bean
    public JobDetail dailyDigestJobDetail() {
        return JobBuilder.newJob(DailyDigestJob.class)
                .withIdentity("DailyDigestJob", "DailyDigestGroup")
                .withDescription("Generates and dispatches daily digest emails to subscribed study members")
                .storeDurably()
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.scheduler.daily-digest.enabled", havingValue = "true", matchIfMissing = true)
    public Trigger dailyDigestTrigger(JobDetail dailyDigestJobDetail) {
        return TriggerBuilder.newTrigger()
                .forJob(dailyDigestJobDetail)
                .withIdentity("DailyDigestTrigger", "DailyDigestGroup")
                .withDescription("Triggers daily digest generation at 08:59 AM")
                .withSchedule(CronScheduleBuilder.cronSchedule(dailyDigestCron)
                        .withMisfireHandlingInstructionDoNothing())
                .build();
    }

    @Bean
    public JobDetail checkLocksJobDetail() {
        return JobBuilder.newJob(CheckLocksDailyJob.class)
                .withIdentity("CheckLocksDailyJob", "SecurityGroup")
                .withDescription("Checks user accounts daily for inactivity and excessive failed attempts")
                .storeDurably()
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.scheduler.check-locks.enabled", havingValue = "true", matchIfMissing = true)
    public Trigger checkLocksTrigger(JobDetail checkLocksJobDetail) {
        return TriggerBuilder.newTrigger()
                .forJob(checkLocksJobDetail)
                .withIdentity("CheckLocksTrigger", "SecurityGroup")
                .withDescription("Triggers user account lock check at 08:55 AM")
                .withSchedule(CronScheduleBuilder.cronSchedule(checkLocksCron)
                        .withMisfireHandlingInstructionDoNothing())
                .build();
    }
}
