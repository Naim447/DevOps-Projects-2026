# Project 10: Automate Server Configuration with Ansible

## Difficulty

- **Level:** 🟡 **Intermediate**
- **Time to build:** 6–8 hours (including testing on a fresh EC2)
- **Prerequisite:** Project 1 — Host a Static Website on AWS. Do Project 1 manually first, then automate server configuration here.

## Tools Required

- 🤖 **Ansible**
- 🐧 **Linux**
- ☁️ **AWS EC2**
- 📂 **Git**
- 🔐 **SSH key pair** (`.pem` — never commit it, see `.gitignore`)

## Project Overview

Managing multiple servers manually is repetitive and error-prone.

Ansible automates server configuration without requiring agents on target machines.

In this project you automate a whole server, with one command:

```bash
ansible-playbook playbooks/site.yml
```

Ansible will, on every server in the inventory:

1. Install Apache automatically
2. Create users
3. Configure firewall rules
4. Deploy application files
5. Restart services — only when something actually changed (handlers)

Run it a second time and Ansible reports **0 changed** — that is idempotency, and it is the single most important Ansible idea for interviews.

> **Why Ansible?**
>
> Terraform (Project 6) creates the infrastructure. Ansible configures what runs *on* it. Terraform = "give me a server", Ansible = "make that server a web server, the same way, every time". Interviewers ask for both, in that order.

## Architecture

```
Your laptop (control node)
        │  ansible-playbook playbooks/site.yml
        │  SSH (port 22, key only, no password)
        ▼
┌─────────────────────────────────────────┐
│  AWS EC2 — Ubuntu 22.04 (webservers)    │
│                                         │
│  common role  → apt update, tools,      │
│                 timezone                │
│  users role   → create devops + deploy  │
│                 users, SSH keys, sudo   │
│  firewall role → UFW: 22 / 80 / 443     │
│  apache role  → install Apache,         │
│                 template virtual host,  │
│                 enable + start service  │
│  app role     → deploy index.html,      │
│                 style.css, script.js    │
│                                         │
│  Apache :80 ──► /var/www/html ──► 🌐   │
└─────────────────────────────────────────┘
```

## Project Tasks

- [x] Install Apache automatically
- [x] Create users
- [x] Configure firewall rules
- [x] Deploy application files
- [x] Restart services

## Skills You'll Learn

- Playbooks
- Inventory Files
- Roles
- Variables
- Idempotent Automation
- Jinja2 templates and handlers (how the restart-on-change works)
- `--check --diff` (dry run), `--limit`, `--tags`
- Ansible Vault for secrets (pattern only — no real secret in this repo)
- Health-check playbook with the `uri` module

## Resume Value

- Demonstrates configuration management skills.
- Shows automation experience for enterprise environments.
- Shows you can take a manual server setup and turn it into a repeatable, auditable automation — exactly what a DevOps / Cloud Engineer and a corporate trainer are hired to do.
- The `site.yml` + roles structure is the same layout used in real teams. Walk an interviewer through it file by file.
- Frequently discussed in **DevOps job interviews**: *"What is idempotency? What is a handler? Roles vs playbooks? How do you handle secrets?"* — all are answered by this project. See `docs/INTERVIEW-QUESTIONS.md`.

## Project Structure

```
Project-10-Ansible/
├── README.md                     # this file
├── ansible.cfg                   # defaults: inventory, roles path, SSH settings
├── requirements.yml              # no external collection needed (builtin only)
├── .gitignore                    # never commit .pem, vault passwords, .retry
├── .ansible-lint                 # lint rules for CI
├── inventory/
│   ├── hosts.ini                 # <-- EDIT THIS: your EC2 public IP / DNS
│   ├── hosts.yml                 # same inventory in YAML (alternative)
│   └── group_vars/
│       ├── all.yml               # variables for every host
│       └── webservers/
│           ├── main.yml          # variables for webservers only (users, Apache, firewall)
│           └── vault.yml.example # Vault pattern (encrypt the real one)
├── playbooks/
│   ├── site.yml                  # main playbook — runs all roles
│   ├── deploy.yml                # deploy / redeploy application files only (fast)
│   ├── update-website.yml        # alias for deploy.yml (kept for clarity)
│   └── health-check.yml          # verify HTTP 200, Apache running
├── roles/
│   ├── common/tasks/main.yml     # apt update, tools, timezone
│   ├── users/tasks/main.yml      # create users, SSH keys, sudo
│   ├── firewall/tasks/main.yml   # UFW: allow 22, 80, 443
│   ├── apache/
│   │   ├── tasks/main.yml
│   │   ├── handlers/main.yml     # restart / reload Apache
│   │   ├── templates/apache-site.conf.j2
│   │   └── vars/main.yml
│   └── app/
│       ├── tasks/main.yml
│       ├── handlers/main.yml
│       ├── templates/index.html.j2
│       ├── files/style.css
│       └── files/script.js
├── docs/
│   ├── INTERVIEW-QUESTIONS.md
│   └── TROUBLESHOOTING.md
├── scripts/
│   ├── run.sh                    # one-command wrapper: check → deploy → verify
│   └── test-local.sh             # syntax check + lint, no server needed
└── .github/workflows/ansible-lint.yml
```

## Step-by-Step

### 1. Prepare the server (once, manually — same as Project 1)

1. Launch an **Ubuntu 22.04** EC2 instance (Free Tier `t2.micro` / `t3.micro` is enough).
2. Security Group — allow inbound:
   | Protocol | Port | Source | Purpose |
   | --- | --- | --- | --- |
   | SSH | 22 | My IP | Ansible + your SSH |
   | HTTP | 80 | Anywhere | Website |
   | HTTPS | 443 | Anywhere | Later, for HTTPS |
3. Download the `.pem` key. Keep it outside this repo:
   ```bash
   chmod 400 ~/keys/my-key.pem
   ```

### 2. Install Ansible on your control node

```bash
# Ubuntu / Debian / WSL
sudo apt update && sudo apt install -y ansible

# macOS
brew install ansible

# Check
ansible --version
ansible-lint --version   # optional, for CI parity
```

No Galaxy collection is needed for this project — every task uses `ansible.builtin` modules only, so there is nothing extra to install.

### 3. Point the inventory at your server — and check the users

Edit `inventory/hosts.ini` — replace the example IP with your EC2 public IP or DNS, and the key path:

```ini
[webservers]
web1 ansible_host=YOUR_EC2_PUBLIC_IP ansible_user=ubuntu ansible_ssh_private_key_file=~/keys/my-key.pem
```

> Do **not** put a real IP or a real `.pem` file in GitHub. The example IP `203.0.113.10` in this repo is a documentation address (TEST-NET-3) and will not connect anywhere.

Check the users that will be created, in `inventory/group_vars/webservers/main.yml`:

```yaml
users:
  - name: devops
    groups: ["sudo", "www-data"]
  - name: deploy
    groups: ["www-data"]
```

Both are created with no password (SSH keys only). Add a real SSH public key in `ssh_key` if you want to log in as that user. Leave it empty (`""`) to create the user with no key yet.

Test the connection first — this must work before any playbook will:

```bash
ansible webservers -m ping
ansible webservers -m setup -a "filter=ansible_distribution*"   # see facts
```

### 4. Dry run first (always, in interviews too)

```bash
ansible-playbook playbooks/site.yml --check --diff
```

`--check` changes nothing. `--diff` shows exactly what *would* change. Read it.

### 5. Deploy

```bash
ansible-playbook playbooks/site.yml
```

Or use the wrapper (does check → deploy → health-check):

```bash
bash scripts/run.sh
```

Expected output ends like:

```
PLAY RECAP
web1  : ok=20  changed=12  unreachable=0  failed=0
```

### 6. Verify

```bash
ansible-playbook playbooks/health-check.yml
# check the users were created:
ansible webservers -m shell -a "id devops; id deploy"
# or in a browser:
http://YOUR_EC2_PUBLIC_IP
```

You should see the site with **"Deployed with Ansible"** in the footer, and the server hostname / deployment time rendered by the Jinja2 template.

### 7. Prove idempotency (do this in the interview demo)

```bash
ansible-playbook playbooks/site.yml
# second run: ok=20  changed=0  ...
```

If the second run shows `changed=0`, your roles are idempotent. If it shows changes every time, something in a task is not idempotent — find it before you present the project. Note: the HTML page renders the deployment time, so `index.html` may show as changed on a re-run — the Apache install, users, firewall and config tasks should show `changed=0`. See `docs/TROUBLESHOOTING.md`.

### 8. Change the application, redeploy only the application

Edit `roles/app/templates/index.html.j2` or `roles/app/files/style.css`, then:

```bash
ansible-playbook playbooks/deploy.yml
# or: ansible-playbook playbooks/site.yml --tags app
```

Apache is **not** reinstalled and users are **not** recreated. Only the application files change, and the handler restarts Apache only if a file changed.

## Common Commands

```bash
# Syntax check (no server needed)
ansible-playbook playbooks/site.yml --syntax-check
ansible-inventory --list

# Run one role / one tag only
ansible-playbook playbooks/site.yml --tags apache
ansible-playbook playbooks/site.yml --tags users
ansible-playbook playbooks/site.yml --tags app
ansible-playbook playbooks/site.yml --skip-tags firewall

# Run on one host only
ansible-playbook playbooks/site.yml --limit web1

# Verbose — use when a task fails
ansible-playbook playbooks/site.yml -v
ansible-playbook playbooks/site.yml -vvv   # SSH debug

# Lint (same check CI runs)
ansible-lint
bash scripts/test-local.sh
```

## Variables You Will Actually Change

All in `inventory/group_vars/webservers/main.yml` — no need to edit tasks:

| Variable | Default | What it does |
| --- | --- | --- |
| `site_title` | `DevOps Portfolio — Naim Khan` | `<title>` and heading |
| `apache_server_name` | `_` (any host) | Apache `ServerName` |
| `apache_document_root` | `/var/www/html` | Where the application lives |
| `apache_port` | `80` | Apache listen port |
| `users` | `devops`, `deploy` | Users to create, with groups and SSH keys |
| `enable_firewall` | `true` | Turn UFW on/off |
| `allowed_ssh_cidr` | `0.0.0.0/0` | Narrow to your IP in production |

## Secrets — Ansible Vault (pattern)

No real secret is stored in this repo. The pattern is:

```bash
# Create a vault file (you will be asked for a vault password)
ansible-vault create inventory/group_vars/webservers/vault.yml

# Inside it, e.g.:
# admin_password: "{{ vault_admin_password }}"

# Edit it later
ansible-vault edit inventory/group_vars/webservers/vault.yml

# Run a playbook with it
ansible-playbook playbooks/site.yml --ask-vault-pass
```

Never commit `vault-password.txt`, `*.pem`, or an unencrypted `vault.yml`. They are all in `.gitignore`.

## 🎯 Final Project Flow

```
Control node
  ↓ ansible-playbook playbooks/site.yml
Inventory (hosts.ini)
  ↓ SSH
EC2 Ubuntu
  ↓ common → users → firewall → apache → app
Apache :80
  ↓
🌐 Website (http://<EC2_PUBLIC_IP>)
```

## ✅ Final Checklist

- [ ] `ansible webservers -m ping` succeeds
- [ ] `ansible-playbook playbooks/site.yml --check --diff` reviewed
- [ ] First run: `changed > 0`, `failed=0`
- [ ] Website opens at `http://<EC2_PUBLIC_IP>`
- [ ] `id devops` and `id deploy` work on the server
- [ ] Second run: `changed=0` (idempotent, apart from the timestamp in index.html)
- [ ] `ansible-playbook playbooks/health-check.yml` passes
- [ ] Edit one line in `index.html.j2`, redeploy with `deploy.yml`, see the change
- [ ] `ansible-lint` passes (or CI is green)
- [ ] No `.pem`, real IP, or vault password committed — check `git status`
- [ ] Screenshots: ping, first run recap, second run recap (`changed=0`), website in browser

## What to Show in an Interview

1. Open `playbooks/site.yml` — 5 roles, in order, with tags. Explain why that order matters (users before Apache, firewall before the site goes live).
2. Open `roles/apache/handlers/main.yml` — "Apache restarts only when the config or application changes."
3. Run the playbook twice live — first run changes, second run `changed=0`.
4. Answer: *"What happens if the playbook fails halfway?"* — Ansible stops, you fix the cause, re-run; completed tasks are skipped because they are already in the desired state. See `docs/INTERVIEW-QUESTIONS.md`.

## Clean Up (save money)

```bash
# Stop / terminate the EC2 instance in the AWS Console when you are done.
# Ansible does not manage the EC2 lifecycle in this project —
# that is Terraform's job (Project 6). Keep the two tools separate.
```

---

*Project 10 of DevOps-Projects-2026. Project 1 did this by hand. This project does it as code — Apache, users, firewall and application, all from one playbook.*
