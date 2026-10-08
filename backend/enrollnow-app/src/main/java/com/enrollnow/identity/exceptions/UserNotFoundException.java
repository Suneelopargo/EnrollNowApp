package com.enrollnow.identity.exceptions;

import java.util.UUID;

public class UserNotFoundException extends RuntimeException {

    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public UserNotFoundException(UUID userId) {
        super("User not found: " + userId);
    }
}