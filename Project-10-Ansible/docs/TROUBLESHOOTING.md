# Troubleshooting — Project 10

## `ansible webservers -m ping` — UNREACHABLE

- Check the IP in `inventory/hosts.ini` is the current EC2 public IP (it changes on stop/start unless you use an Elastic IP).
- Check the Security Group allows SSH (22) from your IP.
- Check the key path and permissions: `chmod 400 ~/keys/my-key.pem`.
- Test SSH by hand first: `ssh -i ~/keys/my-key.pem ubuntu@YOUR_IP`.

## `Permission denied (publickey)`

- Wrong key, wrong user (`ubuntu` for Ubuntu AMIs, not `ec2-user` — that is Amazon Linux), or the key file has the wrong permissions.
- Never paste a `.pem` into the repo to "fix" this — fix the path in the inventory.

## `Failed to connect ... port 22: Connection timed out`

- Security Group, not Ansible. Port 22 is blocked or the IP is wrong. Check the AWS Console.

## Playbook fails on `apt` — "Could not get lock"

- Another `apt` process is running on the server (cloud-init on first boot). Wait 1–2 minutes and re-run. Re-running is safe — see idempotency.

## Apache is running but the site shows the default Apache page

- The template did not deploy, or the handler did not reload. Check `/etc/apache/sites-available/default` on the server, then run:
  ```bash
  ansible-playbook playbooks/site.yml --tags apache,website -v
  sudo apache -t
  ```

## Second run still shows `changed=N` (not idempotent)

- Something in a task always reports a change. Common causes: a `shell` / `command` task without `changed_when`, or a template that renders a timestamp that changes every run. In this project the timestamp is rendered into the HTML, so `index.html` **will** show changed on re-runs if facts change — that is expected for the demo page. The Apache install, firewall and config tasks should show `changed=0`. If you want a fully clean second run for a demo, remove the `{{ ansible_facts['date_time']['iso8601'] }}` line from `index.html.j2`.

## `ansible-lint` complains about a module name

- Use fully-qualified names: `ansible.builtin.apt`, not `apt`. This project already does that.

## A task reports "couldn't resolve module/action"

- This project uses `ansible.builtin` modules only, so this should not happen. If it does, check the module name is spelled correctly and that you are running Ansible 2.15 or newer (`ansible --version`).
