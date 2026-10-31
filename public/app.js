/* Same-origin frontend: session cookies stay HTTP-only; API enforces every role. */
(() => {
  const $ = (id) => document.getElementById(id);
  let currentUser;
  let currentPage = "jobs";
  let viewGeneration = 0;
  let customers = [];
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
    $("job-editor").hidden = true;
    $("job-details").hidden = true;
    $("job-form").reset();
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
    $("job-editor").hidden = true;
    $("job-details").hidden = true;
    $("new-job").hidden = page !== "jobs" || currentUser?.role !== "owner";
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
          const detailsButton = node("button", record.title, "text-button");
          detailsButton.type = "button";
          detailsButton.addEventListener("click", () => showJob(record));
          title.append(
            detailsButton,
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
  function showJob(job, saved = false) {
    const details = $("job-details");
    details.replaceChildren(node("h2", saved ? "Job scheduled successfully" : job.title));
    const entries = [
      ["Job", job.title], ["Description", job.description],
      ["Customer", customers.find(c => c.customer_id === job.customer_id) ? (() => { const c = customers.find(c => c.customer_id === job.customer_id); return c.first_name + " " + c.last_name; })() : "Customer #" + job.customer_id],
      ["Scheduled for", job.scheduled_at ? new Date(job.scheduled_at).toLocaleString() : "Not scheduled"],
      ["Location", [job.service_street, job.service_city, job.service_state, job.service_zip_code].join(", ")],
      ["Instructions", job.instructions || "None"], ["Status", job.status.replaceAll("_", " ")],
    ];
    const list = node("dl");
    entries.forEach(([label, value]) => list.append(node("dt", label), node("dd", value)));
    details.append(list);
    details.hidden = false;
    details.focus();
  }
  $("new-job").addEventListener("click", async () => {
    const generation = viewGeneration;
    $("new-job").disabled = true;
    $("workspace-message").textContent = "Loading scheduling options…";
    try {
      const [customerRows, services] = await Promise.all([api("/customers"), api("/services")]);
      if (generation !== viewGeneration || currentUser?.role !== "owner") return;
      customers = customerRows;
      $("job-form").reset();
      for (const [id, rows, key, label] of [
        ["job-customer", customers, "customer_id", c => c.first_name + " " + c.last_name],
        ["job-service", services, "service_id", s => s.name],
      ]) {
        const select = $(id);
        select.replaceChildren(new Option("Choose an option", ""));
        rows.forEach(row => select.add(new Option(label(row), row[key])));
      }
      $("save-job").disabled = !customers.length || !services.length;
      $("job-error").textContent = !customers.length || !services.length ? "An existing customer and an active service are needed before scheduling a job." : "";
      $("schedule-zone").textContent = "Date and time use your time zone: " + Intl.DateTimeFormat().resolvedOptions().timeZone;
      $("job-details").hidden = true;
      $("job-editor").hidden = false;
      $("workspace-message").textContent = "";
      $("job-customer").focus();
    } catch (error) {
      if (generation === viewGeneration) $("workspace-message").textContent = error.message;
    } finally { $("new-job").disabled = false; }
  });
  $("job-customer").addEventListener("change", () => {
    const customer = customers.find(c => c.customer_id === Number($("job-customer").value));
    if (!customer) return;
    for (const [field, source] of [["street", "street"], ["city", "city"], ["state", "state"], ["zip_code", "zip_code"]])
      $("job-service_" + field).value = customer[source];
  });
  $("cancel-job").addEventListener("click", () => {
    $("job-editor").hidden = true;
    $("new-job").focus();
  });
  $("job-form").addEventListener("submit", async event => {
    event.preventDefault();
    const generation = viewGeneration;
    const form = $("job-form");
    const data = Object.fromEntries(new FormData(form));
    for (const key of Object.keys(data)) data[key] = data[key].trim();
    if (Object.entries(data).some(([key, value]) => key !== "instructions" && !value)) {
      $("job-error").textContent = "Fill out all required fields.";
      return;
    }
    const scheduled = new Date(data.date + "T" + data.time);
    // Reject local times skipped by a daylight-saving clock change.
    const [hours, minutes] = data.time.split(":").map(Number);
    if (!Number.isFinite(scheduled.getTime()) || scheduled.getHours() !== hours || scheduled.getMinutes() !== minutes) {
      $("job-error").textContent = "Choose a valid local date and time.";
      return;
    }
    data.customer_id = Number(data.customer_id);
    data.service_id = Number(data.service_id);
    data.scheduled_at = scheduled.toISOString();
    delete data.date; delete data.time;
    $("save-job").disabled = true;
    $("cancel-job").disabled = true;
    $("job-error").textContent = "";
    try {
      const job = await api("/jobs", { method: "POST", body: JSON.stringify(data) });
      if (generation !== viewGeneration || !currentUser) return;
      await loadPage("jobs");
      if (currentUser && currentPage === "jobs") showJob(job, true);
      form.reset();
    } catch (error) {
      if (generation === viewGeneration) $("job-error").textContent = error.message;
    } finally {
      $("save-job").disabled = false;
      $("cancel-job").disabled = false;
    }
  });
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
