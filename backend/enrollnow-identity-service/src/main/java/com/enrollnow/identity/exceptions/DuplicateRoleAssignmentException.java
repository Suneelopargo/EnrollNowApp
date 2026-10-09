package com.enrollnow.identity.exceptions;

public class DuplicateRoleAssignmentException extends RuntimeException {

    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public DuplicateRoleAssignmentException() {
        super("Role is already assigned to this user at the requested scope");
    }
}