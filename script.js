document.addEventListener("DOMContentLoaded", function () {

  // ============ UI NAVIGATION CONTROLLERS ============
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      const isHidden = mobileMenu.classList.toggle("hidden");
      menuBtn.setAttribute("aria-expanded", String(!isHidden));
    });

    // Close mobile dropdown when a navigation node anchor is clicked
    document.querySelectorAll(".mobile-nav-link").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Interventions Scroll Animations Observer Setup
  const revealElements = document.querySelectorAll(".reveal");
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = "running";
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach((element) => {
    element.style.animationPlayState = "paused";
    scrollObserver.observe(element);
  });


  // ============ APPLICATION WORKSPACE CONTROL MATRICES ============
  const steps = {
    1: document.getElementById("step-patient-info"),
    2: document.getElementById("step-mri-upload"),
    3: document.getElementById("step-processing"),
    4: document.getElementById("step-result"),
    5: document.getElementById("step-report")
  };

  const badges = {
    1: document.getElementById("badge-step-1"),
    2: document.getElementById("badge-step-2"),
    3: document.getElementById("badge-step-3"),
    4: document.getElementById("badge-step-4")
  };

  // GLOBAL APPLICATION STATE MACHINE ARCHIVE OBJECT
  function createInitialAppState() {
    return {
      patient: {
        name: "",
        gender: "",
        dob: "",
        phone: "",
        email: "",
        doctor: "",
        notes: ""
      },
      imageSrc: null,
      imageFile: null,
      fileName: "",
      fileSize: "",
      analysisResult: {
        predictedClass: "",
        confidence: 0.0,
        probabilities: {}
      }
    };
  }

  let appState = createInitialAppState();

  // ROUTER CONTROLLER ENGINE STEP NAVIGATOR
  function navigateToStep(targetStepIndex) {
    Object.keys(steps).forEach((idx) => {
      if (parseInt(idx) === targetStepIndex) {
        steps[idx].classList.remove("hidden-element");
        steps[idx].classList.add("reveal-anim");
      } else {
        steps[idx].classList.add("hidden-element");
        steps[idx].classList.remove("reveal-anim");
      }
    });

    // Synchronize progress bar headers tracking
    Object.keys(badges).forEach((idx) => {
      const badgeIndex = parseInt(idx);
      if (badgeIndex === targetStepIndex) {
        badges[badgeIndex].classList.add("active");
      } else if (badgeIndex > targetStepIndex) {
        badges[badgeIndex].classList.remove("active");
      } else {
        badges[badgeIndex].classList.add("active"); // Maintain visual state validation for previous nodes
      }
    });

    // Direct layout view scrolling centering focus onto the step tracker
    const stepperElement = document.querySelector(".workflow-stepper");
    if (stepperElement && targetStepIndex > 1) {
      stepperElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Initialize suite workspace state target mapping
  navigateToStep(1);


  // ============ STEP 1 OPERATIONS: CLIENT VALIDATION MATRICES ============
  const patientForm = document.getElementById("patientDetailsForm");
  const btnCancelForm = document.getElementById("btn-cancel-form");

  if (patientForm) {
    patientForm.addEventListener("submit", function (e) {
      e.preventDefault();
      
      const requiredInputs = patientForm.querySelectorAll("[required]");
      let isFormValid = true;

      requiredInputs.forEach((input) => {
        const parentGroup = input.closest(".form-group");
        if (!input.value.trim()) {
          isFormValid = false;
          if (parentGroup) parentGroup.classList.add("invalid-entry");
        } else {
          if (parentGroup) parentGroup.classList.remove("invalid-entry");
        }
      });

      if (isFormValid) {
        // Map user text into global environment state tracking parameters
        appState.patient.name = document.getElementById("pat-name").value;
        appState.patient.gender = document.getElementById("pat-gender").value;
        appState.patient.dob = document.getElementById("pat-dob").value;
        appState.patient.phone = document.getElementById("pat-phone").value;
        appState.patient.email = document.getElementById("pat-email").value || "N/A";
        appState.patient.doctor = document.getElementById("pat-doctor").value || "Self-Referred / Open Workspace Exploration";
        appState.patient.notes = document.getElementById("pat-notes").value || "No clinical conditions mapped into workspace runtime memory.";

        // Advance to data asset file ingestion module
        navigateToStep(2);
      }
    });

    // Reset layout highlighting tags dynamic loops triggers
    patientForm.querySelectorAll("[required]").forEach((input) => {
      input.addEventListener("input", function () {
        if (this.value.trim()) {
          const group = this.closest(".form-group");
          if (group) group.classList.remove("invalid-entry");
        }
      });
    });

    if (btnCancelForm) {
      btnCancelForm.addEventListener("click", function () {
        patientForm.reset();
        patientForm.querySelectorAll(".form-group").forEach((g) => g.classList.remove("invalid-entry"));
      });
    }
  }


  // ============ STEP 2 OPERATIONS: DRAG & DROP MATRIX INGESTION ============
  const mriDragDropZone = document.getElementById("mriDragDropZone");
  const mriFileInput = document.getElementById("mriFileInput");
  const btnTriggerBrowse = document.getElementById("btn-trigger-browse");
  const dropzoneDefaultContent = document.getElementById("dropzone-default-content");
  const dropzonePreviewContent = document.getElementById("dropzone-preview-content");
  const mriImagePreview = document.getElementById("mriImagePreview");
  const metaFileName = document.getElementById("meta-file-name");
  const metaFileSize = document.getElementById("meta-file-size");
  const btnRemoveAsset = document.getElementById("btn-remove-asset");
  const btnStartAnalysis = document.getElementById("btn-start-analysis");

  if (mriDragDropZone && mriFileInput) {
    btnTriggerBrowse.addEventListener("click", (e) => {
      e.stopPropagation();
      mriFileInput.click();
    });
    
    mriDragDropZone.addEventListener("click", () => {
      if (mriFileInput.value === "") {
        mriFileInput.click();
      }
    });

    // Drag-over manipulation classes
    ["dragenter", "dragover"].forEach((eventName) => {
      mriDragDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        mriDragDropZone.classList.add("drag-over-active");
      }, false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      mriDragDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        mriDragDropZone.classList.remove("drag-over-active");
      }, false);
    });

    mriDragDropZone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length) {
        processIncomingImageFile(files[0]);
      }
    });

    mriFileInput.addEventListener("change", function () {
      if (this.files.length) {
        processIncomingImageFile(this.files[0]);
      }
    });
  }

  function processIncomingImageFile(file) {
    if (!file.type.startsWith("image/")) {
      alert("Invalid format execution block. Please provide standard structural pixel assets (PNG/JPG).");
      return;
    }
    
    appState.fileName = file.name;
    appState.fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    appState.imageFile = file;

    const reader = new FileReader();
    reader.onload = function (e) {
      appState.imageSrc = e.target.result;
      
      // Update Preview Asset Node Subsystem layout values
      mriImagePreview.src = appState.imageSrc;
      metaFileName.textContent = appState.fileName;
      metaFileSize.textContent = appState.fileSize;

      dropzoneDefaultContent.classList.add("hidden-element");
      dropzonePreviewContent.classList.remove("hidden-element");
    };
    reader.readAsDataURL(file);
  }

  if (btnRemoveAsset) {
    btnRemoveAsset.addEventListener("click", (e) => {
      e.stopPropagation();
      mriFileInput.value = "";
      appState.imageSrc = null;
      appState.imageFile = null;
      appState.fileName = "";
      appState.fileSize = "";
      
      dropzonePreviewContent.classList.add("hidden-element");
      dropzoneDefaultContent.classList.remove("hidden-element");
    });
  }


  // ============ STEP 3 OPERATIONS: RUNTIME PIPELINE WORKFLOW TICKER ============
  if (btnStartAnalysis) {
    btnStartAnalysis.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!appState.imageSrc) return;

      navigateToStep(3);
      void executeAIWorkflow();
    });
  }

  async function executeAIWorkflow() {
    const titleTextNode = document.getElementById("processing-title-text");
    const statusTextNode = document.getElementById("processing-current-status");
    const barFillNode = document.getElementById("processing-progress-fill");
    const percentNode = document.getElementById("processing-percentage-lbl");

    if (titleTextNode) titleTextNode.textContent = "Processing Brain MRI Scan...";
    if (statusTextNode) statusTextNode.textContent = "Uploading image to the local VGG16 analysis service...";
    if (barFillNode) barFillNode.style.width = "35%";
    if (percentNode) percentNode.textContent = "35%";

    try {
      const formData = new FormData();
      formData.append("image", appState.imageFile, appState.fileName);

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.detail || "The analysis service could not process this image.");
      }
      if (!payload.predicted_class || typeof payload.confidence !== "number" || !payload.probabilities) {
        throw new Error("The analysis service returned an incomplete result.");
      }

      appState.analysisResult = {
        predictedClass: payload.predicted_class,
        confidence: payload.confidence,
        probabilities: payload.probabilities
      };

      if (titleTextNode) titleTextNode.textContent = "Analysis Finalized";
      if (statusTextNode) statusTextNode.textContent = "VGG16 classification received. Synchronizing dashboard monitors...";
      if (barFillNode) barFillNode.style.width = "100%";
      if (percentNode) percentNode.textContent = "100%";

      populateDashboardDOM();
      navigateToStep(4);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Unable to reach the local analysis service.";

      if (titleTextNode) titleTextNode.textContent = "Analysis Unavailable";
      if (statusTextNode) statusTextNode.textContent = message;
      if (barFillNode) barFillNode.style.width = "0%";
      if (percentNode) percentNode.textContent = "0%";

      alert(`Unable to analyze this MRI scan. ${message}`);
      navigateToStep(2);
    }
  }


  // ============ STEP 4 OPERATIONS: RESULTS DASHBOARD ============
  function populateDashboardDOM() {
    const predictedClass = appState.analysisResult.predictedClass;
    const isPositive = predictedClass !== "notumor";
    const confidenceString = (appState.analysisResult.confidence * 100).toFixed(1) + "%";

    // --- DASHBOARD RENDER FRAME INJECTIONS (STEP 4) ---
    document.getElementById("result-mri-display").src = appState.imageSrc;
    document.getElementById("res-pat-name").textContent = appState.patient.name;
    document.getElementById("res-pat-gender").textContent = appState.patient.gender;
    document.getElementById("res-pat-dob").textContent = formatDateString(appState.patient.dob);
    document.getElementById("res-pat-phone").textContent = appState.patient.phone;
    document.getElementById("res-pat-doc").textContent = appState.patient.doctor;
    document.getElementById("res-pat-notes").textContent = appState.patient.notes;
    
    document.getElementById("confidence-percentage-value").textContent = confidenceString;
    document.getElementById("confidence-fill-width").style.width = confidenceString;

    const predictionAlertBox = document.getElementById("prediction-alert-box");
    const predictionIcon = document.getElementById("prediction-icon");
    const predictionTextLabel = document.getElementById("prediction-text-label");

    if (isPositive) {
      if (predictionAlertBox) predictionAlertBox.className = "prediction-badge-card prediction-positive";
      if (predictionIcon) predictionIcon.className = "fa-solid fa-triangle-exclamation";
      if (predictionTextLabel) predictionTextLabel.textContent = `Predicted class: ${formatClassLabel(predictedClass)}`;
    } else {
      if (predictionAlertBox) predictionAlertBox.className = "prediction-badge-card prediction-negative";
      if (predictionIcon) predictionIcon.className = "fa-solid fa-circle-check";
      if (predictionTextLabel) predictionTextLabel.textContent = "Predicted class: No Tumor";
    }

    renderProbabilities(appState.analysisResult.probabilities);
  }

  function formatClassLabel(className) {
    return className === "notumor"
      ? "No Tumor"
      : className.charAt(0).toUpperCase() + className.slice(1);
  }

  function renderProbabilities(probabilities) {
    const predictionMeta = document.querySelector(".badge-meta-content");
    if (!predictionMeta) return;

    let probabilityNode = document.getElementById("prediction-probabilities");
    if (!probabilityNode) {
      probabilityNode = document.createElement("p");
      probabilityNode.id = "prediction-probabilities";
      probabilityNode.className = "mt-1 text-xs text-[var(--ink-soft)] font-mono leading-relaxed";
      predictionMeta.appendChild(probabilityNode);
    }

    probabilityNode.classList.remove("hidden-element");
    probabilityNode.textContent = Object.entries(probabilities)
      .map(([className, probability]) => `${formatClassLabel(className)}: ${(probability * 100).toFixed(1)}%`)
      .join(" | ");
  }

  function formatDateString(rawDateString) {
    if (!rawDateString) return "N/A";
    const parts = rawDateString.split("-");
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`; // MM/DD/YYYY standard re-mapping layout
    }
    return rawDateString;
  }

  // ============ STEP 5 OPERATIONS: CLASSIFIER-BASED REPORT ============
  function setReportValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function createFallbackReport() {
    const { predictedClass, confidence, probabilities } = appState.analysisResult;
    const classLabel = formatClassLabel(predictedClass);
    const confidenceLabel = `${(confidence * 100).toFixed(1)}%`;
    const probabilitySummary = Object.entries(probabilities)
      .map(([className, probability]) => `${formatClassLabel(className)}: ${(probability * 100).toFixed(1)}%`)
      .join(" | ");
    return {
      clinical_summary: `The classifier evaluated the submitted MRI image. Its highest-scoring class was ${classLabel} with a confidence of ${confidenceLabel}. Class probabilities: ${probabilitySummary}.`,
      impression: `Classifier output: ${classLabel} (${confidenceLabel} confidence). This statement reports the model output only and is not a diagnosis.`,
      recommendation: "Use this classifier output only as decision-support information. A qualified clinician or radiologist should review the original images and the patient's clinical context.",
      disclaimer: "This automated classification does not establish a diagnosis and does not replace professional medical judgment."
    };
  }

  function populateReportDOM(report) {
    const { predictedClass } = appState.analysisResult;
    const classLabel = formatClassLabel(predictedClass);
    const generatedAt = new Date();
    const reportTimestamp = generatedAt.toLocaleString();
    const reportId = `MRI-AI-${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(2, "0")}${String(generatedAt.getDate()).padStart(2, "0")}-${String(generatedAt.getHours()).padStart(2, "0")}${String(generatedAt.getMinutes()).padStart(2, "0")}${String(generatedAt.getSeconds()).padStart(2, "0")}`;
    const patientDetails = `Patient details: ${appState.patient.name}; Gender: ${appState.patient.gender}; Date of birth: ${formatDateString(appState.patient.dob)}; Phone: ${appState.patient.phone}; Clinician: ${appState.patient.doctor}. Registered notes: ${appState.patient.notes}`;

    setReportValue("report-id-generated", reportId);
    setReportValue("rep-pat-name", appState.patient.name);
    setReportValue("rep-pat-gender", appState.patient.gender);
    setReportValue("rep-pat-dob", formatDateString(appState.patient.dob));
    setReportValue("rep-pat-doc", appState.patient.doctor);
    setReportValue("rep-date", reportTimestamp);
    setReportValue("rep-indication-text", patientDetails);
    setReportValue("rep-findings-text", report.clinical_summary);
    setReportValue("rep-impression-text", report.impression);
    setReportValue("rep-recommendation-text", `${report.recommendation} Disclaimer: ${report.disclaimer}`);

    const impressionBadge = document.getElementById("rep-impression-badge");
    if (impressionBadge) {
      impressionBadge.className = `badge-pill ${predictedClass === "notumor" ? "pill-success" : "pill-danger"}`;
      impressionBadge.textContent = `CLASSIFIER OUTPUT: ${classLabel.toUpperCase()}`;
    }

  }

  async function generateClassifierReport() {
    const { predictedClass, confidence, probabilities } = appState.analysisResult;
    if (!predictedClass || typeof confidence !== "number" || !probabilities) {
      alert("A completed classifier result is required before a report can be generated.");
      return false;
    }

    let report = createFallbackReport();
    try {
      const response = await fetch("http://127.0.0.1:8000/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: appState.patient,
          predicted_class: predictedClass,
          confidence,
          probabilities
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.clinical_summary || !payload.impression || !payload.recommendation || !payload.disclaimer) {
        throw new Error("The AI report service returned an incomplete response.");
      }
      report = payload;
    } catch (error) {
      console.warn("AI report generation is unavailable; using the local classifier-only fallback.", error);
    }

    populateReportDOM(report);
    return true;
  }

  // Bind dynamic navigation buttons to transition anchors
  const viewReportBtn = document.getElementById("btn-view-report-anchor");
  if (viewReportBtn) {
    viewReportBtn.addEventListener("click", async function () {
      if (await generateClassifierReport()) navigateToStep(5);
    });
  }

  // ============ NEW PATIENT SESSION RESET ============
  function resetTextContent(ids, value) {
    ids.forEach((id) => setReportValue(id, value));
  }

  function resetPatientSession() {
    if (patientForm) {
      patientForm.reset();
      patientForm.querySelectorAll(".form-group").forEach((group) => group.classList.remove("invalid-entry"));
    }
    if (mriFileInput) mriFileInput.value = "";

    appState = createInitialAppState();

    if (mriImagePreview) mriImagePreview.src = "";
    if (metaFileName) metaFileName.textContent = "asset_sequence_matrix.png";
    if (metaFileSize) metaFileSize.textContent = "0.00 MB";
    if (dropzonePreviewContent) dropzonePreviewContent.classList.add("hidden-element");
    if (dropzoneDefaultContent) dropzoneDefaultContent.classList.remove("hidden-element");

    const resultImage = document.getElementById("result-mri-display");
    if (resultImage) resultImage.src = "";
    const predictionAlertBox = document.getElementById("prediction-alert-box");
    const predictionIcon = document.getElementById("prediction-icon");
    if (predictionAlertBox) predictionAlertBox.className = "prediction-badge-card text-left";
    if (predictionIcon) predictionIcon.className = "fa-solid fa-circle-check";
    setReportValue("prediction-text-label", "Processing Complete");
    setReportValue("confidence-percentage-value", "0.0%");
    const confidenceFill = document.getElementById("confidence-fill-width");
    if (confidenceFill) confidenceFill.style.width = "0%";
    const predictionMeta = document.querySelector(".badge-meta-content");
    let probabilityNode = document.getElementById("prediction-probabilities");
    if (!probabilityNode && predictionMeta) {
      probabilityNode = document.createElement("p");
      probabilityNode.id = "prediction-probabilities";
      probabilityNode.className = "mt-1 text-xs text-[var(--ink-soft)] font-mono leading-relaxed";
      predictionMeta.appendChild(probabilityNode);
    }
    if (probabilityNode) {
      probabilityNode.textContent = "";
      probabilityNode.classList.add("hidden-element");
    }

    resetTextContent(
      ["res-pat-name", "res-pat-gender", "res-pat-dob", "res-pat-phone", "res-pat-doc"],
      "—"
    );
    setReportValue("res-pat-notes", "No specialized clinical conditions mapped.");

    setReportValue("processing-title-text", "Initializing Tensor Network Core...");
    setReportValue("processing-current-status", "Mapping sequence spatial orientations into voxel array sets...");
    setReportValue("processing-percentage-lbl", "0%");
    const progressFill = document.getElementById("processing-progress-fill");
    if (progressFill) progressFill.style.width = "0%";

    setReportValue("report-id-generated", "RAD-AI-00000-2026");
    resetTextContent(["rep-pat-name", "rep-pat-gender", "rep-pat-dob", "rep-pat-doc", "rep-date"], "—");
    setReportValue("rep-indication-text", "Patient details will be populated after classifier processing.");
    setReportValue("rep-findings-text", "Classifier output will be populated after processing.");
    setReportValue("rep-impression-text", "The report is populated from the completed classifier result.");
    setReportValue("rep-recommendation-text", "Recommendation and disclaimer will be populated after processing.");
    const reportBadge = document.getElementById("rep-impression-badge");
    if (reportBadge) {
      reportBadge.className = "badge-pill";
      reportBadge.textContent = "AWAITING CLASSIFIER OUTPUT";
    }

    navigateToStep(1);
  }

  document.querySelectorAll("[data-new-patient]").forEach((newPatientBtn) => {
    newPatientBtn.addEventListener("click", function () {
      if (window.confirm("Start a new patient session? This will clear the current data.")) {
        resetPatientSession();
      }
    });
  });

  // --- REPORT EXPORT PRINT MACROS (STEP 5) ---
  const printBtn = document.getElementById("btn-action-print");
  const pdfBtn = document.getElementById("btn-action-pdf");

  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }
  if (pdfBtn) {
    pdfBtn.addEventListener("click", () => window.print()); // System layout printing styles compile into print-to-PDF engine wheels natively
  }

});
