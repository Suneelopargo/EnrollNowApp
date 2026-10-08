package com.enrollnow.identity.exceptions;

public class RoleNotFoundException extends RuntimeException {

    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public RoleNotFoundException(String roleCode) {
        super("Role not found: " + roleCode);
    }
}