-- ============================================================
-- DEVELOPMENT / DEMO DATA ONLY
-- Site Permission assignments for Identity Sprint demo.
--
-- DO NOT move this file into db/migration.
-- ============================================================

DO $$
DECLARE
    v_tenant_id UUID :=
        '11111111-1111-1111-1111-111111111111';

    v_site_id UUID;
BEGIN

    /*
     * Use one existing site for the demo tenant.
     */
    SELECT id
      INTO v_site_id
      FROM enrollnow.sites
     WHERE tenant_id = v_tenant_id
     ORDER BY name
     LIMIT 1;

    IF v_site_id IS NULL THEN
        RAISE EXCEPTION
            'No site exists for demo tenant %',
            v_tenant_id;
    END IF;


    /*
     * Remove existing active SITE assignments for
     * the demo users so this script can be rerun.
     */
    UPDATE enrollnow.user_role_assignments
       SET active = FALSE
     WHERE tenant_id = v_tenant_id
       AND user_id IN
       (
           '44444444-4444-4444-4444-444444444444',
           'f4f05d90-6706-4108-a35b-0df2a91a1e74',
           '08e7b15f-47cf-4f6b-9ed3-052492fc036b',
           '2f0de1bf-f96c-4ebe-9573-c67011609e3b'
       )
       AND site_id IS NOT NULL
       AND active = TRUE;


    /*
     * Anita -> NONE
     *
     * No active SITE role assignment is intentionally
     * created for Anita.
     */


    /*
     * Rahul -> SITE_MANAGER
     */
    INSERT INTO enrollnow.user_role_assignments
    (
        id,
        tenant_id,
        user_id,
        role_id,
        site_id,
        active,
        created_at
    )
    VALUES
    (
        gen_random_uuid(),
        v_tenant_id,
        'f4f05d90-6706-4108-a35b-0df2a91a1e74',
        '53000000-0000-0000-0000-000000000002',
        v_site_id,
        TRUE,
        CURRENT_TIMESTAMP
    );


    /*
     * John -> SITE_REGISTRY
     */
    INSERT INTO enrollnow.user_role_assignments
    (
        id,
        tenant_id,
        user_id,
        role_id,
        site_id,
        active,
        created_at
    )
    VALUES
    (
        gen_random_uuid(),
        v_tenant_id,
        '08e7b15f-47cf-4f6b-9ed3-052492fc036b',
        '53000000-0000-0000-0000-000000000001',
        v_site_id,
        TRUE,
        CURRENT_TIMESTAMP
    );


    /*
     * Sriram -> SITE_ADMIN
     */
    INSERT INTO enrollnow.user_role_assignments
    (
        id,
        tenant_id,
        user_id,
        role_id,
        site_id,
        active,
        created_at
    )
    VALUES
    (
        gen_random_uuid(),
        v_tenant_id,
        '2f0de1bf-f96c-4ebe-9573-c67011609e3b',
        '53000000-0000-0000-0000-000000000003',
        v_site_id,
        TRUE,
        CURRENT_TIMESTAMP
    );

END $$;