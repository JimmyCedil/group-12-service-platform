/* Same-origin frontend: session cookies stay HTTP-only; API enforces every role. */
(() => {
  const $ = (id) => document.getElementById(id);
  let currentUser;
  let currentPage = "jobs";
  let viewGeneration = 0;
  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    if (response.status === 204) return;
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && path !== "/auth/login") showLogin();
      throw new Error(data.error || "Unable to complete the request");
    }
    return data;
  }
  function showLogin() {
    viewGeneration++;
    currentUser = undefined;
    $("workspace-view").hidden = true;
    $("login-view").hidden = false;
    $("records").replaceChildren();
    $("password").value = "";
    document.title = "CrewLink · Sign in";
  }
  function showWorkspace(user) {
    viewGeneration++;
    currentUser = user;
    $("login-view").hidden = true;
    $("workspace-view").hidden = false;
    $("user-email").textContent = user.email;
    $("role-label").textContent = user.role === "owner" ? "Owner" : "Employee";
    $("customers-nav").hidden = user.role !== "owner";
    $("jobs-nav-label").textContent =
      user.role === "owner" ? "Jobs" : "My Jobs";
    document.title = "CrewLink · Workspace";
    loadPage("jobs");
  }
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  async function loadPage(page) {
    currentPage = page;
    const generation = ++viewGeneration;
    const isOwner = currentUser?.role === "owner";
    $("page-title").textContent =
      page === "customers" ? "Customers" : isOwner ? "Jobs" : "My Jobs";
    $("page-subtitle").textContent =
      page === "customers"
        ? "Your customer directory, all in one place."
        : isOwner
          ? "An overview of the work your crew has on the go."
          : "Your assigned work. Start a job or mark it complete.";
    $("jobs-nav").classList.toggle("active", page === "jobs");
    $("customers-nav").classList.toggle("active", page === "customers");
    $("records").replaceChildren();
    $("workspace-message").textContent = "Loading…";
    try {
      const records = await api("/" + page);
      if (generation !== viewGeneration || currentPage !== page || !currentUser)
        return;
      $("workspace-message").textContent = "";
      if (!records.length) {
        $("records").append(
          node(
            "div",
            page === "customers"
              ? "No customers yet."
              : isOwner
                ? "No jobs yet. New jobs will appear here."
                : "You have no assigned jobs yet. Check with your owner for your next assignment.",
            "empty",
          ),
        );
        return;
      }
      const table = node("table");
      const caption = node(
        "caption",
        page === "jobs" ? "Accessible jobs" : "Customer directory",
        "visually-hidden",
      );
      table.append(caption);
      const head = node("thead");
      const header = node("tr");
      const labels =
        page === "jobs"
          ? ["Job", "Location", "Schedule", "Status", "Progress"]
          : ["Customer", "Email", "Phone", "City"];
      labels.forEach((label) => {
        const th = node("th", label);
        th.scope = "col";
        header.append(th);
      });
      head.append(header);
      table.append(head);
      const body = node("tbody");
      records.forEach((record) => {
        const row = node("tr");
        if (page === "customers") {
          [
            record.first_name + " " + record.last_name,
            record.email,
            record.phone,
            record.city,
          ].forEach((text) => row.append(node("td", text)));
        } else {
          const title = node("td");
          title.append(
            node("strong", record.title),
            node("span", record.description, "small"),
          );
          row.append(
            title,
            node(
              "td",
              [record.service_street, record.service_city]
                .filter(Boolean)
                .join(", ") || "Not specified",
            ),
            node(
              "td",
              record.scheduled_at
                ? new Date(record.scheduled_at).toLocaleString()
                : "Not scheduled",
            ),
          );
          const status = node("td");
          status.append(
            node(
              "span",
              record.status.replaceAll("_", " "),
              "status " + record.status,
            ),
          );
          row.append(status);
          const actions = node("td");
          const buttons = node("div", undefined, "job-actions");
          ["in_progress", "completed"]
            .filter((value) => value !== record.status)
            .forEach((value) => {
              const button = node(
                "button",
                value === "in_progress" ? "Start" : "Complete",
                "secondary",
              );
              button.type = "button";
              button.setAttribute(
                "aria-label",
                (value === "in_progress" ? "Start " : "Complete ") +
                  record.title,
              );
              button.addEventListener("click", async () => {
                button.disabled = true;
                try {
                  await api("/jobs/" + record.job_id, {
                    method: "PATCH",
                    body: JSON.stringify({ status: value }),
                  });
                  await loadPage("jobs");
                } catch (error) {
                  $("workspace-message").textContent = error.message;
                  button.disabled = false;
                }
              });
              buttons.append(button);
            });
          actions.append(buttons);
          row.append(actions);
        }
        body.append(row);
      });
      table.append(body);
      $("records").replaceChildren(table);
    } catch (error) {
      $("workspace-message").textContent = error.message;
    }
  }
  $("toggle-password").addEventListener("click", () => {
    const visible = $("password").type === "password";
    $("password").type = visible ? "text" : "password";
    $("toggle-password").textContent = visible ? "Hide" : "Show";
    $("toggle-password").setAttribute("aria-pressed", String(visible));
  });
  $("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("login-error").hidden = true;
    $("sign-in").disabled = true;
    $("sign-in").textContent = "Signing in…";
    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: $("email").value,
          password: $("password").value,
        }),
      });
      $("password").value = "";
      showWorkspace(result.user);
    } catch (error) {
      $("login-error").textContent = error.message;
      $("login-error").hidden = false;
    } finally {
      $("sign-in").disabled = false;
      $("sign-in").textContent = "Sign in";
    }
  });
  $("logout").addEventListener("click", async () => {
    try {
      await api("/auth/logout", { method: "POST", body: "{}" });
      showLogin();
      $("email").focus();
    } catch (error) {
      $("workspace-message").textContent = error.message;
    }
  });
  $("jobs-nav").addEventListener("click", () => loadPage("jobs"));
  $("customers-nav").addEventListener("click", () => loadPage("customers"));
  api("/auth/me")
    .then((result) => showWorkspace(result.user))
    .catch(() => showLogin());
})();
