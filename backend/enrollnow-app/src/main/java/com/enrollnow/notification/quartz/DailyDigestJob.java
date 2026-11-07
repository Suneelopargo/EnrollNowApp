package com.enrollnow.notification.quartz;

import com.enrollnow.notification.services.DailyDigestService;
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
public class DailyDigestJob extends QuartzJobBean {

    private static final Logger log = LoggerFactory.getLogger(DailyDigestJob.class);

    private final DailyDigestService dailyDigestService;

    @Autowired
    public DailyDigestJob(DailyDigestService dailyDigestService) {
        this.dailyDigestService = dailyDigestService;
    }

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        log.info("Executing Quartz DailyDigestJob trigger at {}", context.getFireTime());
        try {
            dailyDigestService.generateAndSendAllDailyDigests();
        } catch (Exception e) {
            log.error("Error executing DailyDigestJob: {}", e.getMessage(), e);
            throw new JobExecutionException(e);
        }
    }
}
