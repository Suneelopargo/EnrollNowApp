package com.enrollnow.identity.exceptions;

public class EmailAlreadyExistsException extends RuntimeException {

    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public EmailAlreadyExistsException(String email) {
        super("A user with this email address already exists. Use the Reset Password or Resend Enrollment options if they cannot access the system.");
    }
}