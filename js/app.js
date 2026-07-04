let preguntas = [];
let preguntaActual = 0;
let puntaje = 0;
let modoSimulacro = false;
let nombreEvaluacion = "";
let respuestasUsuario = [];

const menuPrincipal = document.getElementById("menu-principal");
const pantallaQuiz = document.getElementById("pantalla-quiz");
const pantallaResultado = document.getElementById("pantalla-resultado");

const contadorPregunta = document.getElementById("contador-pregunta");
const puntajeTexto = document.getElementById("puntaje");
const temaTexto = document.getElementById("tema");
const preguntaTexto = document.getElementById("pregunta");
const opcionesDiv = document.getElementById("opciones");
const feedbackDiv = document.getElementById("feedback");
const btnSiguiente = document.getElementById("btn-siguiente");
const resultadoFinal = document.getElementById("resultado-final");
const progreso = document.getElementById("progreso");
const historialResultados = document.getElementById("historial-resultados");
const revisionRespuestas = document.getElementById("revision-respuestas");

async function iniciarAPO(numeroAPO) {
    modoSimulacro = false;
    nombreEvaluacion = `APO ${numeroAPO}`;

    try {
        const respuesta = await fetch(`data/apo${numeroAPO}.json`);

        if (!respuesta.ok) {
            throw new Error(`No se encontró apo${numeroAPO}.json`);
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos) || datos.length === 0) {
            alert(`El archivo apo${numeroAPO}.json está vacío o no tiene formato válido.`);
            return;
        }

        preguntas = mezclarArray([...datos]);

        reiniciarQuiz();
        mostrarPantalla(pantallaQuiz);
        mostrarPregunta();
        

    } catch (error) {
        alert("No se pudo cargar el archivo de la APO seleccionada.");
        console.error(error);
    }
}

async function iniciarSimulacro() {
    modoSimulacro = true;
    nombreEvaluacion = "Simulacro integrador";

    let todasLasPreguntas = [];

    try {
        for (let i = 1; i <= 12; i++) {
            const respuesta = await fetch(`data/apo${i}.json`);

            if (!respuesta.ok) {
                console.warn(`No se pudo cargar apo${i}.json`);
                continue;
            }

            const preguntasAPO = await respuesta.json();

            if (Array.isArray(preguntasAPO)) {
                todasLasPreguntas = todasLasPreguntas.concat(preguntasAPO);
            }
        }

        if (todasLasPreguntas.length === 0) {
            alert("No hay preguntas disponibles para generar el simulacro.");
            return;
        }

        preguntas = await generarSimulacroInteligente();

        reiniciarQuiz();
        mostrarPantalla(pantallaQuiz);
        mostrarPregunta();

    } catch (error) {
        alert("No se pudo cargar el simulacro integrador.");
        console.error(error);
    }
}

function reiniciarQuiz() {
    preguntaActual = 0;
    puntaje = 0;
    respuestasUsuario = [];
    actualizarPuntaje();
    
}

function mostrarPregunta() {
    const pregunta = preguntas[preguntaActual];
    actualizarBarra();

    contadorPregunta.textContent = `Pregunta ${preguntaActual + 1}/${preguntas.length}`;
    temaTexto.textContent = pregunta.tema;
    preguntaTexto.textContent = pregunta.pregunta;

    opcionesDiv.innerHTML = "";
    feedbackDiv.classList.add("oculto");
    feedbackDiv.innerHTML = "";
    btnSiguiente.classList.add("oculto");

    if (preguntaActual === preguntas.length - 1) {
        btnSiguiente.textContent = "Finalizar";
    } else {
        btnSiguiente.textContent = "Siguiente";
    }

    pregunta.respuestas.forEach((respuesta, index) => {
        const boton = document.createElement("button");
        boton.textContent = respuesta.texto;
        boton.onclick = () => seleccionarRespuesta(index);
        opcionesDiv.appendChild(boton);
    });
}

function seleccionarRespuesta(indiceSeleccionado) {
    const pregunta = preguntas[preguntaActual];
    const botones = opcionesDiv.querySelectorAll("button");
    respuestasUsuario.push({
    pregunta: pregunta.pregunta,
    tema: pregunta.tema,
    elegida: pregunta.respuestas[indiceSeleccionado].texto,
    correcta: pregunta.respuestas.find(r => r.correcta).texto,
    fueCorrecta: pregunta.respuestas[indiceSeleccionado].correcta,
    explicacion: pregunta.explicacion
});

    botones.forEach((boton, index) => {
        boton.disabled = true;

        if (pregunta.respuestas[index].correcta) {
            boton.classList.add("correcta");
        }

        if (index === indiceSeleccionado && !pregunta.respuestas[index].correcta) {
            boton.classList.add("incorrecta");
        }
    });

    if (pregunta.respuestas[indiceSeleccionado].correcta) {
        puntaje++;
        actualizarPuntaje();
        feedbackDiv.innerHTML = `<strong>Correcto.</strong><br>${pregunta.explicacion}`;
    } else {
        const correcta = pregunta.respuestas.find(r => r.correcta);

        feedbackDiv.innerHTML = `
            <strong>Incorrecto.</strong><br>
            La respuesta correcta era: <strong>${correcta.texto}</strong><br><br>
            ${pregunta.explicacion}
        `;
    }

    feedbackDiv.classList.remove("oculto");
    btnSiguiente.classList.remove("oculto");
}

function siguientePregunta() {
    preguntaActual++;

    if (preguntaActual < preguntas.length) {
        mostrarPregunta();
    } else {
        mostrarResultado();
    }
}

function mostrarResultado() {
    mostrarPantalla(pantallaResultado);

    const total = preguntas.length;
    const porcentaje = Math.round((puntaje / total) * 100);

    const nota = ((puntaje / total) * 10).toFixed(1);
    const aprobado = nota >= 6;

resultadoFinal.innerHTML = `
    Evaluación: <strong>${nombreEvaluacion}</strong><br><br>

    Correctas: <strong>${puntaje}</strong><br>
    Incorrectas: <strong>${total - puntaje}</strong><br>
    Porcentaje: <strong>${porcentaje}%</strong><br><br>

    Nota final: <strong>${nota} / 10</strong><br>
    Estado: <strong>${aprobado ? "APROBADO" : "DESAPROBADO"}</strong>
`;

    guardarResultado(nombreEvaluacion, puntaje, total, porcentaje);
    mostrarRevision();
}

function guardarResultado(evaluacion, correctas, total, porcentaje) {
    const historial = JSON.parse(localStorage.getItem("historialBiologia")) || [];

    const nuevoResultado = {
        evaluacion: evaluacion,
        correctas: correctas,
        total: total,
        porcentaje: porcentaje,
        fecha: new Date().toLocaleString()
        
    };

    historial.push(nuevoResultado);

    localStorage.setItem("historialBiologia", JSON.stringify(historial));
    cargarHistorial();
}

function volverMenu() {
    mostrarPantalla(menuPrincipal);
}

function mostrarPantalla(pantallaActiva) {
    menuPrincipal.classList.remove("activa");
    pantallaQuiz.classList.remove("activa");
    pantallaResultado.classList.remove("activa");

    pantallaActiva.classList.add("activa");
}

function actualizarPuntaje() {
    puntajeTexto.textContent = `Puntaje: ${puntaje}`;
}

function mezclarArray(array) {
    return array.sort(() => Math.random() - 0.5);
}
function actualizarBarra() {

    const porcentaje =
        (preguntaActual / preguntas.length) * 100;

    progreso.style.width = porcentaje + "%";

}
window.onload = () => {

    cargarHistorial();
    cargarModoOscuro();

};
function cargarHistorial() {

    const historial =
        JSON.parse(localStorage.getItem("historialBiologia")) || [];

    historialResultados.innerHTML = "";

    if (historial.length === 0) {

        historialResultados.innerHTML =
            "<p>No hay resultados guardados.</p>";

        return;
    }

    historial
        .slice()
        .reverse()
        .forEach(item => {

            historialResultados.innerHTML += `

            <div class="item-historial">

                <strong>${item.evaluacion}</strong><br>

                ${item.correctas}/${item.total}
                (${item.porcentaje}%)<br>

                <small>${item.fecha}</small>

            </div>

            `;

        });

}
function borrarHistorial(){

    if(confirm("¿Desea borrar todo el historial?")){

        localStorage.removeItem("historialBiologia");

        cargarHistorial();

    }

}
function alternarModoOscuro() {
    document.body.classList.toggle("modo-oscuro");

    const modoActivo = document.body.classList.contains("modo-oscuro");

    localStorage.setItem("modoOscuroBiologia", modoActivo);
}

function cargarModoOscuro() {
    const modoActivo = localStorage.getItem("modoOscuroBiologia") === "true";

    if (modoActivo) {
        document.body.classList.add("modo-oscuro");
    }
}
function mostrarRevision() {
    revisionRespuestas.innerHTML = "<h3>Revisión de respuestas</h3>";

    respuestasUsuario.forEach((item, index) => {
        const clase = item.fueCorrecta ? "correcta-revision" : "incorrecta-revision";

        revisionRespuestas.innerHTML += `
            <div class="revision-item ${clase}">
                <strong>Pregunta ${index + 1}</strong><br>
                <em>${item.tema}</em><br><br>

                ${item.pregunta}<br><br>

                Tu respuesta: <strong>${item.elegida}</strong><br>
                Respuesta correcta: <strong>${item.correcta}</strong><br><br>

                <strong>Explicación:</strong> ${item.explicacion}
            </div>
        `;
    });
}
async function generarSimulacroInteligente() {
    let simulacro = [];

    for (let i = 1; i <= 12; i++) {
        const respuesta = await fetch(`data/apo${i}.json`);

        if (!respuesta.ok) {
            continue;
        }

        const preguntasAPO = await respuesta.json();

        if (!Array.isArray(preguntasAPO)) {
            continue;
        }

        const cantidad = i <= 8 ? 8 : 9;

        const seleccionadas = mezclarArray([...preguntasAPO]).slice(0, cantidad);

        simulacro = simulacro.concat(seleccionadas);
    }

    return mezclarArray(simulacro);
}