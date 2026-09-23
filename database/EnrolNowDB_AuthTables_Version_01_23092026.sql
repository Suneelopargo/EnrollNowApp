--
-- PostgreSQL database dump
--

\restrict zZSeE8LQGyahCjbq7tcvaoZEjBsPpWDMIsMdTwitcJK9QRLePMPI12FenESn5z4

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-09-23 14:56:09

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 239 (class 1259 OID 90932)
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_logs (
    id bigint NOT NULL,
    action character varying(100) NOT NULL,
    performed_by bigint,
    performed_by_username character varying(100),
    target_user_id bigint,
    target_username character varying(100),
    details text,
    ip_address character varying(50),
    location_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_audit_logs OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 90931)
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_audit_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5213 (class 0 OID 0)
-- Dependencies: 238
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_audit_logs_id_seq OWNED BY public.admin_audit_logs.id;


--
-- TOC entry 219 (class 1259 OID 90651)
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 90860)
-- Name: navigation_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.navigation_links (
    id integer NOT NULL,
    module_id integer NOT NULL,
    link_code character varying(60) NOT NULL,
    title character varying(100) NOT NULL,
    path character varying(200) NOT NULL,
    icon character varying(50) DEFAULT 'FileText'::character varying,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.navigation_links OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 90859)
-- Name: navigation_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.navigation_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.navigation_links_id_seq OWNER TO postgres;

--
-- TOC entry 5214 (class 0 OID 0)
-- Dependencies: 234
-- Name: navigation_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.navigation_links_id_seq OWNED BY public.navigation_links.id;


--
-- TOC entry 233 (class 1259 OID 90839)
-- Name: navigation_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.navigation_modules (
    id integer NOT NULL,
    module_code character varying(50) NOT NULL,
    title character varying(100) NOT NULL,
    short_title character varying(50),
    icon character varying(50) DEFAULT 'Folder'::character varying,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.navigation_modules OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 90838)
-- Name: navigation_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.navigation_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.navigation_modules_id_seq OWNER TO postgres;

--
-- TOC entry 5215 (class 0 OID 0)
-- Dependencies: 232
-- Name: navigation_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.navigation_modules_id_seq OWNED BY public.navigation_modules.id;


--
-- TOC entry 221 (class 1259 OID 90669)
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id bigint NOT NULL,
    name character varying(200) NOT NULL,
    org_code character varying(50) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 90668)
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_id_seq OWNER TO postgres;

--
-- TOC entry 5216 (class 0 OID 0)
-- Dependencies: 220
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- TOC entry 237 (class 1259 OID 90891)
-- Name: role_link_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_link_access (
    id bigint NOT NULL,
    role_id bigint NOT NULL,
    link_id integer NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    can_export boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_link_access OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 90890)
-- Name: role_link_access_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_link_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_link_access_id_seq OWNER TO postgres;

--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 236
-- Name: role_link_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_link_access_id_seq OWNED BY public.role_link_access.id;


--
-- TOC entry 227 (class 1259 OID 90754)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    role_code character varying(50) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 90753)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 226
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 223 (class 1259 OID 90693)
-- Name: sites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sites (
    id bigint NOT NULL,
    organization_id bigint,
    site_code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    address_line1 character varying(250),
    city character varying(100),
    state character varying(100),
    country character varying(100) DEFAULT 'USA'::character varying,
    postal_code character varying(20),
    phone character varying(50),
    email character varying(150),
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sites OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 90692)
-- Name: sites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sites_id_seq OWNER TO postgres;

--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 222
-- Name: sites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sites_id_seq OWNED BY public.sites.id;


--
-- TOC entry 229 (class 1259 OID 90778)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    role_id bigint NOT NULL,
    valid_from timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    valid_until timestamp with time zone,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 90777)
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO postgres;

--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 228
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- TOC entry 231 (class 1259 OID 90810)
-- Name: user_site_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_site_assignments (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    site_id bigint NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_site_assignments OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 90809)
-- Name: user_site_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_site_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_site_assignments_id_seq OWNER TO postgres;

--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 230
-- Name: user_site_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_site_assignments_id_seq OWNED BY public.user_site_assignments.id;


--
-- TOC entry 225 (class 1259 OID 90722)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    organization_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 90721)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 224
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4950 (class 2604 OID 90935)
-- Name: admin_audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_audit_logs_id_seq'::regclass);


--
-- TOC entry 4936 (class 2604 OID 90863)
-- Name: navigation_links id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navigation_links ALTER COLUMN id SET DEFAULT nextval('public.navigation_links_id_seq'::regclass);


--
-- TOC entry 4931 (class 2604 OID 90842)
-- Name: navigation_modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navigation_modules ALTER COLUMN id SET DEFAULT nextval('public.navigation_modules_id_seq'::regclass);


--
-- TOC entry 4906 (class 2604 OID 90672)
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- TOC entry 4941 (class 2604 OID 90894)
-- Name: role_link_access id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_link_access ALTER COLUMN id SET DEFAULT nextval('public.role_link_access_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 90757)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 90696)
-- Name: sites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites ALTER COLUMN id SET DEFAULT nextval('public.sites_id_seq'::regclass);


--
-- TOC entry 4923 (class 2604 OID 90781)
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- TOC entry 4928 (class 2604 OID 90813)
-- Name: user_site_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_site_assignments ALTER COLUMN id SET DEFAULT nextval('public.user_site_assignments_id_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 90725)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5207 (class 0 OID 90932)
-- Dependencies: 239
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_audit_logs (id, action, performed_by, performed_by_username, target_user_id, target_username, details, ip_address, location_id, created_at) FROM stdin;
1	SYSTEM_BOOTSTRAP_ADMIN	1	admin	1	admin	Initial controlled administrator account bootstrap executed successfully	127.0.0.1	\N	2026-09-21 19:50:26.399473+05:30
\.


--
-- TOC entry 5187 (class 0 OID 90651)
-- Dependencies: 219
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	initial core schema	SQL	V1__initial_core_schema.sql	310777498	postgres	2026-09-21 19:50:10.503776	98	t
2	2	rbac and authorization	SQL	V2__rbac_and_authorization.sql	1256103305	postgres	2026-09-21 19:50:10.687933	70	t
3	3	navigation access	SQL	V3__navigation_access.sql	1558410574	postgres	2026-09-21 19:50:10.88071	77	t
4	4	audit foundation	SQL	V4__audit_foundation.sql	354723943	postgres	2026-09-21 19:50:11.00197	26	t
\.


--
-- TOC entry 5203 (class 0 OID 90860)
-- Dependencies: 235
-- Data for Name: navigation_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.navigation_links (id, module_id, link_code, title, path, icon, description, display_order, is_active, created_at) FROM stdin;
1	1	LINK_ADMIN_AUDIT	Audit Ledger	/admin/audit-logs	ScrollText	Security and administrative audit trail	5	t	2026-09-21 19:50:10.90325+05:30
2	1	LINK_ADMIN_SITES	Site Management	/admin/sites	Building	Configure research facility sites and access	4	t	2026-09-21 19:50:10.90325+05:30
3	1	LINK_ADMIN_ROLES	Roles & RBAC	/admin/roles	Shield	Manage roles and dynamic permission matrices	3	t	2026-09-21 19:50:10.90325+05:30
4	1	LINK_ADMIN_USERS	User Management	/admin/users	UserCheck	Manage accounts, activation, and role assignments	2	t	2026-09-21 19:50:10.90325+05:30
5	1	LINK_ADMIN_DASHBOARD	Admin Overview	/admin	LayoutDashboard	Administrative KPI metrics and system summary	1	t	2026-09-21 19:50:10.90325+05:30
6	2	LINK_STUDIES_LIST	Studies Overview	/studies	List	Clinical trials and study setup	1	t	2026-09-21 19:50:10.90325+05:30
7	3	LINK_PARTICIPANTS_LIST	Participant Queue	/participants	UserPlus	Participant recruitment and screening	1	t	2026-09-21 19:50:10.90325+05:30
8	4	LINK_REGISTRY_SEARCH	Registry Intake	/registry	Search	Central participant registry	1	t	2026-09-21 19:50:10.90325+05:30
9	5	LINK_SURVEYS_BUILDER	Survey Studio	/surveys	FileQuestion	Survey and eConsent builder	1	t	2026-09-21 19:50:10.90325+05:30
10	6	LINK_REPORTS_DASHBOARD	Analytics	/reports	TrendingUp	Reporting and recruitment metrics	1	t	2026-09-21 19:50:10.90325+05:30
\.


--
-- TOC entry 5201 (class 0 OID 90839)
-- Dependencies: 233
-- Data for Name: navigation_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.navigation_modules (id, module_code, title, short_title, icon, display_order, is_active, created_at) FROM stdin;
1	MODULE_ADMIN	System Administration	Admin	Settings	100	t	2026-09-21 19:50:10.90325+05:30
2	MODULE_STUDIES	Study Management	Studies	BookOpen	10	t	2026-09-21 19:50:10.90325+05:30
3	MODULE_PARTICIPANTS	Participants & Enrollment	Participants	Users	20	t	2026-09-21 19:50:10.90325+05:30
4	MODULE_REGISTRY	Participant Registry	Registry	Database	30	t	2026-09-21 19:50:10.90325+05:30
5	MODULE_SURVEYS	Surveys & Forms	Surveys	ClipboardList	40	t	2026-09-21 19:50:10.90325+05:30
6	MODULE_REPORTS	Analytics & Reports	Reports	BarChart2	50	t	2026-09-21 19:50:10.90325+05:30
\.


--
-- TOC entry 5189 (class 0 OID 90669)
-- Dependencies: 221
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, org_code, description, status, created_at, updated_at) FROM stdin;
1	EnrollNow Research Network	EN-RESEARCH	Authoritative clinical trial recruitment and participant network	ACTIVE	2026-09-21 19:50:10.54914+05:30	2026-09-21 19:50:10.54914+05:30
\.


--
-- TOC entry 5205 (class 0 OID 90891)
-- Dependencies: 237
-- Data for Name: role_link_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_link_access (id, role_id, link_id, can_view, can_create, can_edit, can_delete, can_export, status, created_at, updated_at) FROM stdin;
1	1	1	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
2	1	2	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
3	1	3	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
4	1	4	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
5	1	5	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
6	1	6	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
7	1	7	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
8	1	8	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
9	1	9	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
10	1	10	t	t	t	t	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
11	2	1	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
12	2	2	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
13	2	3	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
14	2	4	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
15	2	5	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
16	2	6	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
17	2	7	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
18	2	8	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
19	2	9	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
20	2	10	t	t	t	f	t	ACTIVE	2026-09-21 19:50:10.90325+05:30	2026-09-21 19:50:10.90325+05:30
\.


--
-- TOC entry 5195 (class 0 OID 90754)
-- Dependencies: 227
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, role_code, description, status, created_at, updated_at) FROM stdin;
1	Super Administrator	ROLE_SUPER_ADMIN	Unrestricted system-wide identity, security governance, and global administration	ACTIVE	2026-09-21 19:50:10.710302+05:30	2026-09-21 19:50:10.710302+05:30
2	Site Administrator	ROLE_SITE_ADMIN	Site-level user management, role assignments, and site operational settings	ACTIVE	2026-09-21 19:50:10.710302+05:30	2026-09-21 19:50:10.710302+05:30
3	Site Manager	ROLE_SITE_MANAGER	Site coordinator and workflow management	ACTIVE	2026-09-21 19:50:10.710302+05:30	2026-09-21 19:50:10.710302+05:30
4	Study Coordinator	ROLE_STUDY_USER	Study-specific participant recruitment and operational trial workflow	ACTIVE	2026-09-21 19:50:10.710302+05:30	2026-09-21 19:50:10.710302+05:30
5	Registry User	ROLE_REGISTRY_USER	Participant registry search and intake operations	ACTIVE	2026-09-21 19:50:10.710302+05:30	2026-09-21 19:50:10.710302+05:30
\.


--
-- TOC entry 5191 (class 0 OID 90693)
-- Dependencies: 223
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sites (id, organization_id, site_code, name, address_line1, city, state, country, postal_code, phone, email, status, created_at, updated_at) FROM stdin;
1	1	SITE-001	Main Clinical Research Center	100 Innovation Parkway	Boston	MA	USA	02115	\N	\N	ACTIVE	2026-09-21 19:50:10.54914+05:30	2026-09-21 19:50:10.54914+05:30
\.


--
-- TOC entry 5197 (class 0 OID 90778)
-- Dependencies: 229
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role_id, valid_from, valid_until, status, created_at, updated_at) FROM stdin;
1	1	1	2026-09-21 19:50:26.371855+05:30	\N	ACTIVE	2026-09-21 19:50:26.371855+05:30	2026-09-21 19:50:26.372912+05:30
\.


--
-- TOC entry 5199 (class 0 OID 90810)
-- Dependencies: 231
-- Data for Name: user_site_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_site_assignments (id, user_id, site_id, status, created_at) FROM stdin;
1	1	1	ACTIVE	2026-09-21 19:50:26.390955+05:30
\.


--
-- TOC entry 5193 (class 0 OID 90722)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, first_name, last_name, phone, is_active, organization_id, created_at, updated_at) FROM stdin;
1	admin	admin@enrollnow.local	$argon2id$v=19$m=16384,t=2,p=1$zOgGlXQ96U7JH0Z/jGFG3A$r8AldpW35Hp/xEcCAzkcyqDQ4l7jMONcfZSIcgUAeRQ	System	Administrator	\N	t	1	2026-09-21 19:50:25.664661+05:30	2026-09-21 19:50:25.664661+05:30
\.


--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 238
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_audit_logs_id_seq', 131, true);


--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 234
-- Name: navigation_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.navigation_links_id_seq', 10, true);


--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 232
-- Name: navigation_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.navigation_modules_id_seq', 6, true);


--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 220
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organizations_id_seq', 7, true);


--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 236
-- Name: role_link_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_link_access_id_seq', 20, true);


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 226
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 35, true);


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 222
-- Name: sites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sites_id_seq', 7, true);


--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 228
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 148, true);


--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 230
-- Name: user_site_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_site_assignments_id_seq', 1, true);


--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 224
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 190, true);


--
-- TOC entry 5023 (class 2606 OID 90943)
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4953 (class 2606 OID 90666)
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- TOC entry 5012 (class 2606 OID 90881)
-- Name: navigation_links navigation_links_link_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navigation_links
    ADD CONSTRAINT navigation_links_link_code_key UNIQUE (link_code);


--
-- TOC entry 5014 (class 2606 OID 90879)
-- Name: navigation_links navigation_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navigation_links
    ADD CONSTRAINT navigation_links_pkey PRIMARY KEY (id);


--
-- TOC entry 5005 (class 2606 OID 90856)
-- Name: navigation_modules navigation_modules_module_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navigation_modules
    ADD CONSTRAINT navigation_modules_module_code_key UNIQUE (module_code);


--
-- TOC entry 5007 (class 2606 OID 90854)
-- Name: navigation_modules navigation_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navigation_modules
    ADD CONSTRAINT navigation_modules_pkey PRIMARY KEY (id);


--
-- TOC entry 4958 (class 2606 OID 90687)
-- Name: organizations organizations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_name_key UNIQUE (name);


--
-- TOC entry 4960 (class 2606 OID 90689)
-- Name: organizations organizations_org_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_org_code_key UNIQUE (org_code);


--
-- TOC entry 4962 (class 2606 OID 90685)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 5019 (class 2606 OID 90915)
-- Name: role_link_access role_link_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_link_access
    ADD CONSTRAINT role_link_access_pkey PRIMARY KEY (id);


--
-- TOC entry 4983 (class 2606 OID 90772)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 4985 (class 2606 OID 90770)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4987 (class 2606 OID 90774)
-- Name: roles roles_role_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_code_key UNIQUE (role_code);


--
-- TOC entry 4967 (class 2606 OID 90710)
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- TOC entry 4969 (class 2606 OID 90712)
-- Name: sites sites_site_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_site_code_key UNIQUE (site_code);


--
-- TOC entry 5021 (class 2606 OID 90917)
-- Name: role_link_access uq_role_link_access; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_link_access
    ADD CONSTRAINT uq_role_link_access UNIQUE (role_id, link_id);


--
-- TOC entry 4992 (class 2606 OID 90795)
-- Name: user_roles uq_user_role; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT uq_user_role UNIQUE (user_id, role_id);


--
-- TOC entry 4999 (class 2606 OID 90824)
-- Name: user_site_assignments uq_user_site; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_site_assignments
    ADD CONSTRAINT uq_user_site UNIQUE (user_id, site_id);


--
-- TOC entry 4994 (class 2606 OID 90793)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5001 (class 2606 OID 90822)
-- Name: user_site_assignments user_site_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_site_assignments
    ADD CONSTRAINT user_site_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 4975 (class 2606 OID 90743)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4977 (class 2606 OID 90739)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4979 (class 2606 OID 90741)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4954 (class 1259 OID 90667)
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- TOC entry 5024 (class 1259 OID 90954)
-- Name: idx_admin_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs USING btree (action);


--
-- TOC entry 5025 (class 1259 OID 90958)
-- Name: idx_admin_audit_logs_action_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_audit_logs_action_created ON public.admin_audit_logs USING btree (action, created_at);


--
-- TOC entry 5026 (class 1259 OID 90957)
-- Name: idx_admin_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs USING btree (created_at);


--
-- TOC entry 5027 (class 1259 OID 90955)
-- Name: idx_admin_audit_logs_performed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_audit_logs_performed_by ON public.admin_audit_logs USING btree (performed_by);


--
-- TOC entry 5028 (class 1259 OID 90956)
-- Name: idx_admin_audit_logs_target_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_audit_logs_target_user_id ON public.admin_audit_logs USING btree (target_user_id);


--
-- TOC entry 5008 (class 1259 OID 90887)
-- Name: idx_nav_links_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nav_links_code ON public.navigation_links USING btree (link_code);


--
-- TOC entry 5009 (class 1259 OID 90888)
-- Name: idx_nav_links_module_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nav_links_module_id ON public.navigation_links USING btree (module_id);


--
-- TOC entry 5010 (class 1259 OID 90889)
-- Name: idx_nav_links_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nav_links_order ON public.navigation_links USING btree (display_order);


--
-- TOC entry 5002 (class 1259 OID 90857)
-- Name: idx_nav_modules_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nav_modules_code ON public.navigation_modules USING btree (module_code);


--
-- TOC entry 5003 (class 1259 OID 90858)
-- Name: idx_nav_modules_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nav_modules_order ON public.navigation_modules USING btree (display_order);


--
-- TOC entry 4955 (class 1259 OID 90690)
-- Name: idx_organizations_org_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organizations_org_code ON public.organizations USING btree (org_code);


--
-- TOC entry 4956 (class 1259 OID 90691)
-- Name: idx_organizations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organizations_status ON public.organizations USING btree (status);


--
-- TOC entry 5015 (class 1259 OID 90929)
-- Name: idx_role_link_access_link_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_link_access_link_id ON public.role_link_access USING btree (link_id);


--
-- TOC entry 5016 (class 1259 OID 90928)
-- Name: idx_role_link_access_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_link_access_role_id ON public.role_link_access USING btree (role_id);


--
-- TOC entry 5017 (class 1259 OID 90930)
-- Name: idx_role_link_access_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_link_access_status ON public.role_link_access USING btree (status);


--
-- TOC entry 4980 (class 1259 OID 90775)
-- Name: idx_roles_role_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_role_code ON public.roles USING btree (role_code);


--
-- TOC entry 4981 (class 1259 OID 90776)
-- Name: idx_roles_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_status ON public.roles USING btree (status);


--
-- TOC entry 4963 (class 1259 OID 90719)
-- Name: idx_sites_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sites_organization_id ON public.sites USING btree (organization_id);


--
-- TOC entry 4964 (class 1259 OID 90718)
-- Name: idx_sites_site_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sites_site_code ON public.sites USING btree (site_code);


--
-- TOC entry 4965 (class 1259 OID 90720)
-- Name: idx_sites_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sites_status ON public.sites USING btree (status);


--
-- TOC entry 4988 (class 1259 OID 90807)
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- TOC entry 4989 (class 1259 OID 90808)
-- Name: idx_user_roles_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_status ON public.user_roles USING btree (status);


--
-- TOC entry 4990 (class 1259 OID 90806)
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- TOC entry 4995 (class 1259 OID 90836)
-- Name: idx_user_site_assignments_site_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_site_assignments_site_id ON public.user_site_assignments USING btree (site_id);


--
-- TOC entry 4996 (class 1259 OID 90837)
-- Name: idx_user_site_assignments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_site_assignments_status ON public.user_site_assignments USING btree (status);


--
-- TOC entry 4997 (class 1259 OID 90835)
-- Name: idx_user_site_assignments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_site_assignments_user_id ON public.user_site_assignments USING btree (user_id);


--
-- TOC entry 4970 (class 1259 OID 90750)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4971 (class 1259 OID 90751)
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- TOC entry 4972 (class 1259 OID 90752)
-- Name: idx_users_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_organization_id ON public.users USING btree (organization_id);


--
-- TOC entry 4973 (class 1259 OID 90749)
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- TOC entry 5038 (class 2606 OID 90944)
-- Name: admin_audit_logs admin_audit_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5039 (class 2606 OID 90949)
-- Name: admin_audit_logs admin_audit_logs_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5035 (class 2606 OID 90882)
-- Name: navigation_links navigation_links_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navigation_links
    ADD CONSTRAINT navigation_links_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.navigation_modules(id) ON DELETE CASCADE;


--
-- TOC entry 5036 (class 2606 OID 90923)
-- Name: role_link_access role_link_access_link_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_link_access
    ADD CONSTRAINT role_link_access_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.navigation_links(id) ON DELETE CASCADE;


--
-- TOC entry 5037 (class 2606 OID 90918)
-- Name: role_link_access role_link_access_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_link_access
    ADD CONSTRAINT role_link_access_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5029 (class 2606 OID 90713)
-- Name: sites sites_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- TOC entry 5031 (class 2606 OID 90801)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5032 (class 2606 OID 90796)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5033 (class 2606 OID 90830)
-- Name: user_site_assignments user_site_assignments_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_site_assignments
    ADD CONSTRAINT user_site_assignments_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- TOC entry 5034 (class 2606 OID 90825)
-- Name: user_site_assignments user_site_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_site_assignments
    ADD CONSTRAINT user_site_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5030 (class 2606 OID 90744)
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


-- Completed on 2026-09-23 14:56:10

--
-- PostgreSQL database dump complete
--

\unrestrict zZSeE8LQGyahCjbq7tcvaoZEjBsPpWDMIsMdTwitcJK9QRLePMPI12FenESn5z4

