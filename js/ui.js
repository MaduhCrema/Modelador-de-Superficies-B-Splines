document.addEventListener("DOMContentLoaded", function () {
    // Gerenciar as abas
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const parentTabs = this.parentElement.querySelectorAll(".tab");
            parentTabs.forEach((t) => t.classList.remove("active"));

            this.classList.add("active");

            const tabContents =
                this.closest(".section-content").querySelectorAll(".tab-content");
            tabContents.forEach((content) => content.classList.remove("active"));

            const tabId = this.getAttribute("data-tab");
            document.getElementById(tabId).classList.add("active");
        });
    });

    const sectionHeaders = document.querySelectorAll(".section h3");
    sectionHeaders.forEach((header) => {
        header.addEventListener("click", function () {
            const section = this.parentElement;
            section.classList.toggle("collapsed");
        });
    });

    const canvas = document.getElementById("surfaceCanvas");
    const controller = new SurfaceController(canvas);

    const showControlPointsCheckbox =
        document.getElementById("showControlPoints");
    controller.renderer.setShowControlPoints(showControlPointsCheckbox.checked);

    document
        .getElementById("createSurfaceButton")
        .addEventListener("click", () => {
            controller.createNewSurface();
        });

    document
        .getElementById("deleteSurfaceButton")
        .addEventListener("click", () => {
            if (controller.currentSurfaceIndex >= 0) {
                if (confirm("Tem certeza que deseja excluir esta superfície?")) {
                    controller.deleteCurrentSurface();
                }
            } else {
                controller.showError("Nenhuma superfície selecionada para exclusão.");
            }
        });

    // Inicializar lista de superfícies
    controller.updateSurfacesList();
    document
        .getElementById("showControlPoints")
        .addEventListener("change", function () {
            const showPoints = this.checked;

            controller.renderer.setShowControlPoints(showPoints);

            controller.redrawSurface();
        });

    document
        .getElementById("testRotationButton")
        .addEventListener("click", () => {
            controller.startRotationTest();
        });

    document
        .getElementById("controlPointSelect")
        .addEventListener("change", function () {
            const [i, j] = this.value.split(",").map(Number);
            const controlPoint = controller.surface.getControlPoints()[i][j];
            controller.updateCoordinateFields(controlPoint);
        });

    const updateControlPoint = () => {
        const [i, j] = document
            .getElementById("controlPointSelect")
            .value.split(",")
            .map(Number);
        const newPoint = {
            x: parseFloat(document.getElementById("controlPointX").value),
            y: parseFloat(document.getElementById("controlPointY").value),
            z: parseFloat(document.getElementById("controlPointZ").value),
        };
        controller.updateSelectedControlPoint(i, j, newPoint);
    };

    ["controlPointX", "controlPointY", "controlPointZ"].forEach((id) => {
        document.getElementById(id).addEventListener("change", updateControlPoint);
    });

    document.getElementById("updateViewButton").addEventListener("click", () => {
        controller.redrawSurface();
    });

    document
        .getElementById("updateWindowButton")
        .addEventListener("click", () => {
            controller.initializeViewport();
            controller.redrawSurface();
        });

    document
        .getElementById("updateColorsButton")
        .addEventListener("click", () => {
            controller.renderer.setColors(
                document.getElementById("visibleColor").value,
                document.getElementById("hiddenColor").value,
                "#FFFFFF" // Fundo branco fixo
            );
            controller.redrawSurface();
        });

    // NOVOS EVENT LISTENERS PARA TRANSFORMAÇÕES
    document
        .getElementById("applyTransformButton")
        .addEventListener("click", () => {
            controller.applyTransformations();
        });

    document
        .getElementById("resetTransformButton")
        .addEventListener("click", () => {
            controller.resetTransformations();
        });

    document.getElementById("saveStateButton").addEventListener("click", () => {
        controller.saveStateToFile();
    });

    document.getElementById("loadStateButton").addEventListener("click", () => {
        if (controller.surfaces.length > 0) {
            if (
                confirm(
                    "Deseja adicionar as superfícies do arquivo às superfícies existentes?"
                )
            ) {
                document.getElementById("fileInput").click();
            }
        } else {
            document.getElementById("fileInput").click();
        }
    });

    document.getElementById("fileInput").addEventListener("change", async (event) => {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            try {
                await controller.loadStateFromFile(file);
            } catch (error) {
                controller.showError(`Erro ao carregar arquivo: ${error.message}`);
            } finally {
                event.target.value = "";
            }
        }
    });

    // EVENT LISTENERS PARA RENDERIZAÇÃO COM SOMBREAMENTO
    document
        .getElementById("renderWithRGBShadingButton")
        .addEventListener("click", () => {
            if (typeof controller.renderWithRGBShading === "function") {
                controller.renderWithRGBShading();
            } else {
                console.warn("Método renderWithRGBShading não disponível");
            }
        });

    const btnGouraud = document.getElementById("renderWithRGBGouraudButton");
    if (btnGouraud) {
        btnGouraud.addEventListener("click", () => {
            if (typeof controller.renderWithRGBGouraudShading === "function") {
                controller.renderWithRGBGouraudShading();
            } else {
                console.warn("Método renderWithRGBGouraudShading não disponível");
            }
        });
    }

    const btnPhong = document.getElementById("renderWithPhongButton");
    if (btnPhong) {
        btnPhong.addEventListener("click", () => {
            if (typeof controller.renderWithPhongShading === "function") {
                controller.renderWithPhongShading();
            } else {
                console.warn("Método renderWithPhongShading não disponível");
            }
        });
    }

    // Listeners para os controles de iluminação padrão
    [
        "lightX",
        "lightY",
        "lightZ",
        "lightIntensity",
        "ambientIntensity",
        "materialKa",
        "materialKd",
        "materialKs",
        "materialN",
    ].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("change", () => {
                if (document.getElementById("autoUpdateShading")?.checked) {
                    if (typeof controller.renderWithRGBShading === "function") {
                        controller.renderWithRGBShading();
                    }
                }
            });
        }
    });

    // Event listeners para controles RGB
    [
        "lightIntensityR",
        "lightIntensityG",
        "lightIntensityB",
        "ambientIntensityR",
        "ambientIntensityG",
        "ambientIntensityB",
        "materialKaR",
        "materialKaG",
        "materialKaB",
        "materialKdR",
        "materialKdG",
        "materialKdB",
        "materialKsR",
        "materialKsG",
        "materialKsB",
    ].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("change", () => {
                if (document.getElementById("autoUpdateShading")?.checked) {
                    if (typeof controller.renderWithRGBShading === "function") {
                        controller.renderWithRGBShading();
                    }
                }
            });
        }
    });
});
