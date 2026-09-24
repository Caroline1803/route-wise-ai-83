CREATE TYPE public.app_role AS ENUM ('admin','hr','employee');
CREATE TYPE public.employee_status AS ENUM ('PENDING','ACTIVE','BLOCKED');

CREATE TABLE public.companies (
  id serial PRIMARY KEY,
  name text NOT NULL,
  auto_activate boolean NOT NULL DEFAULT false,
  default_monthly_credit numeric(10,2) NOT NULL DEFAULT 350,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies are listed publicly" ON public.companies FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.companies (name, auto_activate) VALUES ('Tech Solutions Brasil', true), ('Grupo Logística Paulista', false);

CREATE TABLE public.employees (
  user_id uuid PRIMARY KEY,
  company_id int NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  cpf text NOT NULL UNIQUE,
  phone text NOT NULL,
  birth_date date NOT NULL,
  department text NOT NULL,
  position text NOT NULL,
  cost_center text NOT NULL,
  employee_number text NOT NULL,
  admission_date date NOT NULL,
  address text NOT NULL,
  zip_code text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  status public.employee_status NOT NULL DEFAULT 'PENDING',
  policy_name text NOT NULL DEFAULT 'Política padrão',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees read own" ON public.employees FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY,
  balance numeric(10,2) NOT NULL DEFAULT 420,
  corporate_credit numeric(10,2) NOT NULL DEFAULT 350,
  cashback numeric(10,2) NOT NULL DEFAULT 35,
  spent_this_month numeric(10,2) NOT NULL DEFAULT 186.50,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wallet read own" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.spending_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  origin text NOT NULL,
  destination text NOT NULL,
  transport_mode text NOT NULL,
  trips_per_day int NOT NULL,
  days_per_week int NOT NULL,
  working_days_month int NOT NULL,
  estimated_daily_cost numeric(10,2) NOT NULL,
  estimated_weekly_cost numeric(10,2) NOT NULL,
  estimated_monthly_cost numeric(10,2) NOT NULL,
  corporate_credit numeric(10,2) NOT NULL,
  estimated_remaining_balance numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.spending_estimates TO authenticated;
GRANT ALL ON public.spending_estimates TO service_role;
ALTER TABLE public.spending_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Estimates read own" ON public.spending_estimates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Estimates insert own" ON public.spending_estimates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Estimates delete own" ON public.spending_estimates FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.access_logs (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  user_id uuid,
  event text NOT NULL,
  success boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.access_logs TO service_role;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX access_logs_email_idx ON public.access_logs (email, created_at DESC);
