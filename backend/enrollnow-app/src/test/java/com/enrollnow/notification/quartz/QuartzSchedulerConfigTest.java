package com.enrollnow.notification.quartz;

import org.junit.jupiter.api.Test;
import org.quartz.JobDetail;
import org.quartz.Trigger;

import static org.junit.jupiter.api.Assertions.*;

class QuartzSchedulerConfigTest {

    @Test
    void testQuartzJobsAndTriggersConfiguration() {
        QuartzSchedulerConfig config = new QuartzSchedulerConfig();

        JobDetail dailyDigestJob = config.dailyDigestJobDetail();
        assertNotNull(dailyDigestJob);
        assertEquals("DailyDigestJob", dailyDigestJob.getKey().getName());
        assertEquals("DailyDigestGroup", dailyDigestJob.getKey().getGroup());
        assertTrue(dailyDigestJob.isDurable());

        Trigger dailyDigestTrigger = config.dailyDigestTrigger(dailyDigestJob);
        assertNotNull(dailyDigestTrigger);
        assertEquals("DailyDigestTrigger", dailyDigestTrigger.getKey().getName());

        JobDetail checkLocksJob = config.checkLocksJobDetail();
        assertNotNull(checkLocksJob);
        assertEquals("CheckLocksDailyJob", checkLocksJob.getKey().getName());
        assertEquals("SecurityGroup", checkLocksJob.getKey().getGroup());
        assertTrue(checkLocksJob.isDurable());

        Trigger checkLocksTrigger = config.checkLocksTrigger(checkLocksJob);
        assertNotNull(checkLocksTrigger);
        assertEquals("CheckLocksTrigger", checkLocksTrigger.getKey().getName());
    }
}
