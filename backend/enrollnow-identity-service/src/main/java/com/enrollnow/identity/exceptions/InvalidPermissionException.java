package com.enrollnow.identity.exceptions;

public class InvalidPermissionException extends RuntimeException {

    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public InvalidPermissionException() {
        super("One or more permission codes are invalid");
    }
}