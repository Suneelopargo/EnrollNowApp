-- Contact-person rows may exist before a phone or email method is added.
ALTER TABLE enrollnow.participant_contacts
    ALTER COLUMN contact_type DROP NOT NULL,
    ALTER COLUMN contact_value DROP NOT NULL;
