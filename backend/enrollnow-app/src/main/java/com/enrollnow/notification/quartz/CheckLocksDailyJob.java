package com.enrollnow.notification.quartz;

import com.enrollnow.notification.services.LockCheckingJobService;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

@Component
@DisallowConcurrentExecution
public class CheckLocksDailyJob extends QuartzJobBean {

    private static final Logger log = LoggerFactory.getLogger(CheckLocksDailyJob.class);

    private final LockCheckingJobService lockCheckingJobService;

    @Autowired
    public CheckLocksDailyJob(LockCheckingJobService lockCheckingJobService) {
        this.lockCheckingJobService = lockCheckingJobService;
    }

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        log.info("Executing Quartz CheckLocksDailyJob trigger at {}", context.getFireTime());
        try {
            lockCheckingJobService.checkLocksDaily();
        } catch (Exception e) {
            log.error("Error executing CheckLocksDailyJob: {}", e.getMessage(), e);
            throw new JobExecutionException(e);
        }
    }
}
