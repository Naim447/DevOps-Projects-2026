# Interview Questions — Project 10 (Ansible)

Use this file to revise before an interview. Answer in your own words, then check the short answer below.

## 1. What is Ansible? Agent or agentless?

Ansible is an agentless configuration-management and automation tool. It connects over SSH (Linux) / WinRM (Windows), runs Python modules on the target, and needs no agent installed on the server. That is the main difference from Puppet / Chef.

## 2. What is idempotency? Why does it matter?

Running a playbook twice should produce the same end state, and the second run should report `changed=0`. It matters because you can safely re-run a playbook after a failure, on a schedule, or on a new server, without duplicating work or breaking what already works. Prove it in this project: run `site.yml` twice.

## 3. Playbook vs role vs task vs module?

- **Module** — one unit of work, e.g. `ansible.builtin.apt`, `ansible.builtin.template`.
- **Task** — one call to a module, with a name.
- **Playbook** — a YAML file with one or more plays; each play maps hosts to roles / tasks.
- **Role** — a reusable, organised bundle (`tasks/`, `handlers/`, `templates/`, `vars/`, `files/`). Roles are how real teams share and reuse automation.

## 4. What is a handler? When does it run?

A handler is a task that runs only when notified by another task, and only once at the end of the play, even if notified many times. Example here: Apache reloads only if the config or website actually changed. Without handlers you would restart Apache on every run.

## 5. How do you handle secrets in Ansible?

Ansible Vault: `ansible-vault create / edit / encrypt`, run with `--ask-vault-pass` or a vault password file. Never commit a plain secret, a `.pem` key, or a vault password. See the `vault.yml.example` in this project.

## 6. How are variables resolved? (precedence, briefly)

Roughly: role defaults < inventory `group_vars` / `host_vars` < play vars < extra vars (`-e`, highest). In this project, `roles/*/vars/main.yml` are defaults, `inventory/group_vars/webservers.yml` overrides them, and `-e site_title="..."` would win over both.

## 7. What is the difference between `copy` and `template`?

- `copy` — sends a file as-is.
- `template` — renders a Jinja2 file first, so variables and facts (`{{ ansible_facts['hostname'] }}`) are filled in. Use `template` for configs and HTML that need values; `copy` for CSS / JS.

## 8. What happens if a playbook fails halfway?

Ansible stops at the failed task (by default). Fix the cause and re-run: tasks already in the desired state are skipped (idempotency), so the run continues from where it failed. Use `--check --diff` first and `-v` / `-vvv` to debug.

## 9. Terraform vs Ansible?

Terraform provisions infrastructure (EC2, VPC, Security Group). Ansible configures the software on that infrastructure (Apache, firewall, website). They are complementary, not competitors. Project 6 = Terraform, Project 10 = Ansible.

## 10. How would you deploy to 50 servers instead of 1?

Add 50 hosts to the `webservers` group in the inventory — the playbook does not change. For speed, increase `forks` in `ansible.cfg` (default 5). For zero-downtime, use a rolling update (`serial: 5` in the play) so only a few servers restart at a time.

## 11. How do you test a playbook without a real server?

- `ansible-playbook --syntax-check`
- `ansible-playbook --check --diff` (dry run, needs a server but changes nothing)
- `ansible-lint`
- For a full test: Molecule + Docker (advanced — mention it, do not fake it).

## 12. What is the difference between `state: present` and `state: latest`?

`present` installs the package if missing and leaves the installed version alone. `latest` upgrades it every run — that breaks idempotency and can surprise you in production. Use `present` unless you deliberately want upgrades.
