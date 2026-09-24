package com.enrollnow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication(scanBasePackages = "com.enrollnow")
public class EnrollNowApplication {

    public static void main(String[] args) {
    	String dbPassword = System.getenv("DB_PASSWORD");

        System.out.println("DB_PASSWORD present: " + (dbPassword != null));
        System.out.println("DB_PASSWORD length: " +
                (dbPassword != null ? dbPassword.length() : 0));
        System.out.println("DB_PASSWORD present: " + dbPassword);

       
        var context = SpringApplication.run(EnrollNowApplication.class, args);

        
    }
}