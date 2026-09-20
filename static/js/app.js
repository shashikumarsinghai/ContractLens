const uploadForm = document.getElementById("uploadForm");
const contractFile = document.getElementById("contractFile");
const analyzeButton = document.getElementById("analyzeButton");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");

// Q&A elements
const qaSection = document.getElementById("qaSection");
const qaForm = document.getElementById("qaForm");
const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const qaLoading = document.getElementById("qaLoading");
const qaError = document.getElementById("qaError");
const qaAnswer = document.getElementById("qaAnswer");
const answerText = document.getElementById("answerText");
const answerSource = document.getElementById("answerSource");

// Current uploaded contract ID
let currentContractId = null;

// ============================================================
// CONTRACT UPLOAD
// ============================================================

uploadForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    hideError();

    const file = contractFile.files[0];

    if (!file) {
        showError("Please select a PDF contract first.");
        return;
    }

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {
        showError("Only PDF files are supported.");
        return;
    }

    const formData = new FormData();
    formData.append("contract", file);

    setLoading(true);

    try {
        const response = await fetch("/upload-contract", {
            method: "POST",
            body: formData
        });

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                data.error || "Contract analysis failed."
            );
        }

        if (!data.analysis) {
            throw new Error(
                "Contract analysis returned incomplete data."
            );
        }

        showDashboard(data);

    } catch (error) {

        console.error("Contract upload error:", error);

        showError(
            getFriendlyError(
                error,
                "Could not analyze the contract."
            )
        );

    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {

    if (isLoading) {

        analyzeButton.disabled = true;
        analyzeButton.textContent = "Analyzing...";
        loadingMessage.classList.remove("d-none");

    } else {

        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze Contract";
        loadingMessage.classList.add("d-none");

    }
}

// ============================================================
// SHOW CONTRACT DASHBOARD
// ============================================================

function showDashboard(data) {

    const oldDashboard =
        document.getElementById("analysisDashboard");

    if (oldDashboard) {
        oldDashboard.remove();
    }

    const analysis = data.analysis || {};

    const overview = analysis.contract_overview || {};
    const termination = analysis.termination || {};
    const obligations = analysis.obligations || [];
    const keyDates = analysis.key_dates || [];
    const importantClauses =
        analysis.important_clauses || [];

    // Save contract ID for Q&A
    currentContractId = data.contract_id;

    // Show Q&A section
    if (qaSection) {
        qaSection.classList.remove("d-none");
    }

    // Reset previous Q&A history
    resetQA();

    const dashboard = document.createElement("section");

    dashboard.id = "analysisDashboard";
    dashboard.className = "mt-5";

    dashboard.innerHTML = `

        <div class="mb-4">

            <h2 class="fw-bold mb-1">
                Contract Analysis
            </h2>

            <p class="text-muted mb-0">
                AI-extracted insights from ${escapeHtml(data.filename)}
            </p>

        </div>

        <!-- Contract Overview -->

        <div class="card shadow-sm border-0 mb-4">

            <div class="card-body p-4">

                <h4 class="fw-bold mb-4">
                    Contract Overview
                </h4>

                <div class="row g-4">

                    ${createInfoCard(
                        "Contract Type",
                        overview.contract_type
                    )}

                    ${createInfoCard(
                        "Effective Date",
                        overview.effective_date
                    )}

                    ${createInfoCard(
                        "Expiration Date",
                        overview.expiration_date
                    )}

                    ${createInfoCard(
                        "Renewal Terms",
                        overview.renewal_terms
                    )}

                    ${createInfoCard(
                        "Payment Terms",
                        overview.payment_terms
                    )}

                </div>

            </div>

        </div>

        <!-- Parties -->

        <div class="card shadow-sm border-0 mb-4">

            <div class="card-body p-4">

                <h4 class="fw-bold mb-3">
                    Parties
                </h4>

                ${createParties(overview.parties)}

            </div>

        </div>

        <!-- Termination -->

        <div class="card shadow-sm border-0 mb-4">

            <div class="card-body p-4">

                <h4 class="fw-bold mb-4">
                    Termination
                </h4>

                <div class="row g-4">

                    ${createInfoCard(
                        "Termination Conditions",
                        termination.termination_conditions
                    )}

                    ${createInfoCard(
                        "Notice Period",
                        termination.notice_period
                    )}

                </div>

            </div>

        </div>

        <!-- Deadline Timeline -->

        <div class="card shadow-sm border-0 mb-4">

            <div class="card-body p-4">

                <div class="mb-4">

                    <h4 class="fw-bold mb-1">
                        Deadline Timeline
                    </h4>

                    <p class="text-muted mb-0">
                        Important dates and deadlines identified
                        from the contract.
                    </p>

                </div>

                ${createTimeline(keyDates)}

            </div>

        </div>

        <!-- Obligations -->

        <div class="card shadow-sm border-0 mb-4">

            <div class="card-body p-4">

                <h4 class="fw-bold mb-3">
                    Obligations
                </h4>

                ${createObligations(obligations)}

            </div>

        </div>

        <!-- Important Clauses -->

        <div class="card shadow-sm border-0 mb-4">

            <div class="card-body p-4">

                <h4 class="fw-bold mb-3">
                    Important Clauses
                </h4>

                ${createImportantClauses(importantClauses)}

            </div>

        </div>

        <!-- Source Information -->

        <div class="alert alert-light border">

            <strong>Source-backed analysis</strong>

            <p class="mb-0 mt-1 text-muted">
                ContractLens preserves page and clause references
                where available so extracted information can be
                traced back to the original document.
            </p>

        </div>
    `;

    uploadForm.parentElement.parentElement.parentElement.appendChild(
        dashboard
    );

    dashboard.scrollIntoView({
        behavior: "smooth"
    });
}

// ============================================================
// DEADLINE TIMELINE
// ============================================================

function createTimeline(keyDates) {

    if (!Array.isArray(keyDates) || keyDates.length === 0) {

        return `
            <div class="text-muted">
                No key dates or deadlines identified.
            </div>
        `;

    }

    return `
        <div class="timeline">

            ${keyDates.map((item, index) => {

                const source =
                    createSourceText(item.source);

                const isLast =
                    index === keyDates.length - 1;

                return `

                    <div class="d-flex">

                        <div
                            class="d-flex flex-column align-items-center me-3"
                        >

                            <div
                                class="rounded-circle bg-dark"
                                style="
                                    width: 14px;
                                    height: 14px;
                                    margin-top: 5px;
                                "
                            ></div>

                            ${
                                !isLast
                                    ? `
                                        <div
                                            class="flex-grow-1 border-start"
                                            style="min-height: 70px;"
                                        ></div>
                                      `
                                    : ""
                            }

                        </div>

                        <div class="pb-4">

                            <div class="fw-bold">
                                ${formatValue(item.date)}
                            </div>

                            <div class="mt-1">
                                ${formatValue(item.event)}
                            </div>

                            <div class="small text-muted mt-2">
                                ${escapeHtml(source)}
                            </div>

                        </div>

                    </div>
                `;
            }).join("")}

        </div>
    `;
}

// ============================================================
// Q&A
// ============================================================

qaForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    hideQAError();

    const question = questionInput.value.trim();

    if (!question) {
        showQAError("Please enter a question.");
        questionInput.focus();
        return;
    }

    if (!currentContractId) {
        showQAError(
            "No contract selected. Please upload the contract again."
        );
        return;
    }

    setQALoading(true);

    try {

        const response = await fetch("/ask-contract", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                contract_id: currentContractId,
                question: question
            })
        });

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                data.error || "Could not answer the question."
            );
        }

        if (!data.answer) {
            throw new Error(
                "The AI returned an empty answer."
            );
        }

        showQAAnswer(data, question);

    } catch (error) {

        console.error("Contract Q&A error:", error);

        showQAError(
            getFriendlyError(
                error,
                "Could not answer the question."
            )
        );

    } finally {

        setQALoading(false);

    }
});

function setQALoading(isLoading) {

    if (isLoading) {

        askButton.disabled = true;
        askButton.textContent = "Asking...";

        qaLoading.classList.remove("d-none");

    } else {

        askButton.disabled = false;
        askButton.textContent = "Ask";

        qaLoading.classList.add("d-none");

    }
}

// ============================================================
// SHOW Q&A ANSWER
// ============================================================

function showQAAnswer(data, question) {

    const answer =
        data.answer || "No answer available.";

    const source =
        createSourceText(data.source);

    const qaItem = document.createElement("div");

    qaItem.className =
        "qa-history-item border rounded p-4 mb-3";

    qaItem.innerHTML = `

        <div class="small text-muted mb-1">
            Question
        </div>

        <div class="fw-semibold mb-3">
            ${escapeHtml(question)}
        </div>

        <div class="small text-muted mb-1">
            Answer
        </div>

        <p class="mb-3 qa-history-answer">
            ${escapeHtml(answer)}
        </p>

        <div class="qa-history-source small">
            ${
                source === "Not available"
                    ? "Source: Not available"
                    : `Source: ${escapeHtml(source)}`
            }
        </div>

    `;

    qaAnswer.appendChild(qaItem);

    qaAnswer.classList.remove("d-none");

    questionInput.value = "";

    questionInput.focus();

    qaItem.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

function showQAError(message) {

    qaError.textContent = message;
    qaError.classList.remove("d-none");

}

function hideQAError() {

    qaError.textContent = "";
    qaError.classList.add("d-none");

}

function resetQA() {

    if (!questionInput) {
        return;
    }

    questionInput.value = "";

    qaAnswer.innerHTML = "";

    qaAnswer.classList.add("d-none");

    hideQAError();

}

// ============================================================
// UI HELPERS
// ============================================================

function createInfoCard(label, value) {

    return `
        <div class="col-md-6">

            <div class="border rounded p-3 h-100">

                <div class="text-muted small mb-1">
                    ${escapeHtml(label)}
                </div>

                <div class="fw-semibold">
                    ${formatValue(value)}
                </div>

            </div>

        </div>
    `;
}

function createParties(parties) {

    if (!Array.isArray(parties) || parties.length === 0) {

        return `
            <p class="text-muted mb-0">
                No parties identified.
            </p>
        `;

    }

    return `
        <div class="row g-3">

            ${parties.map((party) => `

                <div class="col-md-6">

                    <div class="border rounded p-3">
                        ${formatValue(party)}
                    </div>

                </div>

            `).join("")}

        </div>
    `;
}

function createObligations(obligations) {

    if (
        !Array.isArray(obligations) ||
        obligations.length === 0
    ) {

        return `
            <p class="text-muted mb-0">
                No obligations identified.
            </p>
        `;

    }

    return `
        <div class="table-responsive">

            <table class="table align-middle">

                <thead>

                    <tr>
                        <th>Party</th>
                        <th>Obligation</th>
                        <th>Deadline / Frequency</th>
                        <th>Source</th>
                    </tr>

                </thead>

                <tbody>

                    ${obligations.map((item) => {

                        const source =
                            createSourceText(item.source);

                        return `
                            <tr>

                                <td>
                                    ${formatValue(item.party)}
                                </td>

                                <td>
                                    ${formatValue(item.obligation)}
                                </td>

                                <td>
                                    ${formatValue(
                                        item.deadline_or_frequency
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(source)}
                                </td>

                            </tr>
                        `;

                    }).join("")}

                </tbody>

            </table>

        </div>
    `;
}

function createImportantClauses(clauses) {

    if (
        !Array.isArray(clauses) ||
        clauses.length === 0
    ) {

        return `
            <p class="text-muted mb-0">
                No important clauses identified.
            </p>
        `;

    }

    return `
        <ul class="list-group list-group-flush">

            ${clauses.map((clause) => `

                <li class="list-group-item px-0">
                    ${formatValue(clause)}
                </li>

            `).join("")}

        </ul>
    `;
}

function createSourceText(source) {

    if (!source || typeof source !== "object") {
        return "Not available";
    }

    const page =
        source.page
            ? `Page ${source.page}`
            : "";

    const clause =
        source.clause
            ? `Clause ${source.clause}`
            : "";

    if (page && clause) {
        return `${page} — ${clause}`;
    }

    return page || clause || "Not available";
}

function formatValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return `<span class="text-muted">Not specified</span>`;
    }

    if (Array.isArray(value)) {

        if (value.length === 0) {

            return `
                <span class="text-muted">
                    Not specified
                </span>
            `;

        }

        return value
            .map(item => formatValue(item))
            .join("<br>");

    }

    if (typeof value === "object") {

        const entries = Object.entries(value);

        if (entries.length === 0) {

            return `
                <span class="text-muted">
                    Not specified
                </span>
            `;

        }

        return entries
            .map(([key, val]) => `

                <div class="mb-1">

                    <span class="text-muted">
                        ${escapeHtml(formatLabel(key))}:
                    </span>

                    ${formatValue(val)}

                </div>

            `)
            .join("");

    }

    return escapeHtml(String(value));
}

function formatLabel(label) {

    return String(label)
        .replace(/_/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

// ============================================================
// ERROR HANDLING
// ============================================================

async function readJsonResponse(response) {

    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {

        return await response.json();

    }

    const text = await response.text();

    throw new Error(
        `Server returned an unexpected response (${response.status}).`
    );
}

function getFriendlyError(error, fallbackMessage) {

    if (!error) {
        return fallbackMessage;
    }

    if (
        error instanceof TypeError &&
        error.message.toLowerCase().includes("fetch")
    ) {
        return (
            "Could not connect to ContractLens. "
            + "Please make sure the Flask server is running."
        );
    }

    if (error.message) {
        return error.message;
    }

    return fallbackMessage;
}

function showError(message) {

    errorMessage.textContent = message;
    errorMessage.classList.remove("d-none");

}

function hideError() {

    errorMessage.textContent = "";
    errorMessage.classList.add("d-none");

}

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}