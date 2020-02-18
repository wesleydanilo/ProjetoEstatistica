/*/##############################################   ANGULAR
var app = angular.module('spFatec', []);

app.controller('MainCtrl', function($scope) {

});
*/
//##############################################   MANUAL
let input1 = [2000, 3000, 4000, 4000, 3000, 2000, 5000, 2000, 3000, 3000, 3000, 2000, 4000, 4000, 3000, 5000, 4000, 3000, 4000, 3000];
let input2 = "EF;EF;EF;EF;EM;EM;EM;EM;ES;PG;PG;ES;ES;ES;PG;PG;ES;ES;ES;ES;EM;EM;EM;EM;EM;EF;EF;PG;PG;ES";
let input3 = "37;34;20;43;37;55;27;37;23;46;56;43;60;32;27;60;53;51;45;45;28;41;38;38;56;65;63;23;56;34;27;34;38;30;29;47;47;45;42;55;50;35";
let input4 = ['Preta', 'Rosa', 'Rosa', 'Branca', 'Rosa', 'Azul', 'Amarela', 'Preta', 'Branca', 'Rosa', 'Preta', 'Amarela', 'Rosa', 'Branca', 'Branca', 'Azul', 'Rosa', 'Amarela', 'Rosa', 'Branca', 'Branca', 'Azul', 'Branca', 'Branca', 'Branca', 'Branca', 'Azul', 'Branca', 'Rosa', 'Preta'];
let input5 = [6,7,9,10,12,14,15,15,15,16,16,17,18,18,18,18,19,19,20,20,20,20,21,21,21,22,22,23,24,25,25,26,26,28,28,30,32,32,35,39];
let input6 = [3, 4, 3.5, 5, 3.5, 4, 5, 5.5, 4, 5];
let ordem = ['Preta', 'Rosa', 'Branca', 'Azul', 'Amarela'];

//Variaveis globais para tratamento de valores sem precisar recalcular
var tableObj;
var descriptiveClass;
var orderedInputs;

function standardize(inputsValue){ //padroniza os valores recebidos em string para um vetor de string ou numeros
	inputsValue = inputsValue.replace(/,/g, "."); //troca a (,). O ponto flutuante em js deve ser o (.) não a (,)
	inputsValue = inputsValue.replace(/(\r\n|\n|\r)/gm,""); //remove quebras de linha
	let inputs = inputsValue.split(";");// cria o vetor separando a string pelos (;)
	
	//caso a string seja de valores numericos tranforma em tipo number
	let aux = [];	
	for(let i = 0; i < inputs.length; i++){
		aux[i] = isNaN(inputs[i]) ? 0 : 1;
	}	
	if(aux.indexOf(0) == -1 && aux.indexOf(1) == 0){
		for(let i = 0; i < inputs.length; i++){
			inputs[i] = parseFloat(inputs[i]);
		}		
	}
	
	return inputs;
}

function orderBy(inputs, order){//funcao para ordenar seguindo um ordem pre-definida
	let ordered = [];
	ordered = inputs.sort();

	if(order == "ASC"){// crescente
		ordered = ordered.sort(function(a, b){return a-b});
	} else if(order == "DSC"){//decrescente		
		ordered = ordered.sort(function (a, b) {return b.localeCompare(a);});
	} else {//seguindo um vetor de ordenação
		ordered = inputs.sort(function(a, b){return order.indexOf(a) - order.indexOf(b);});
	}
	
	return ordered;
}

function reorderDescriptive(posInit, posEnd){

	let order = [];
	for(let obj of tableObj){
		order.push(obj.name);
	}

	let aux = order[posEnd];
	order[posEnd] = order[posInit];
	order[posInit] = aux;

	let inputValue = document.getElementById("dataInput").value;
	let varName = document.getElementById("dataVar").value;	
	let populacaoAmostra = $('input[name=populacaoAmostra]:checked').val();	
	if(varName == ""){
		varName = "Variável";
	}

	doDescriptive(inputValue, varName, populacaoAmostra, order);
}

function switchSimple(simple){
	let inputValue = document.getElementById("dataInput").value;
	let varName = document.getElementById("dataVar").value;	
	let populacaoAmostra = $('input[name=populacaoAmostra]:checked').val();	
	if(varName == ""){
		varName = "Variável";
	}

	doDescriptive(inputValue, varName, populacaoAmostra, "ASC", simple);
}

function doDescriptive(inputsValue, varName, populacaoAmostra, order = "ASC", forceSimple = false){ //Chamada inicial para processo da estatistica descritiva
	//padroniza os valores recebidos
	let inputs = standardize(inputsValue);
	
	//ordena o vetor em ordem crescente, por padrao
	orderedInputs = orderBy(inputs, order);
	
	//faz chamada para tabela simples
	tableObj = getSimple(orderedInputs);

	//descobre o tipo de variavel
	if(forceSimple){
		descriptiveClass = getClass(orderedInputs, tableObj.length, 999);
	} else {
		descriptiveClass = getClass(orderedInputs, tableObj.length);
	}	
	
	//continua com a tabela simples ou vai para a de intervalos
	if(descriptiveClass == "INTERVAL-NUMBER"){
		tableObj = getInterval(tableObj, orderedInputs);
	}
	
	//adiciona as frequencias
	addFreqs(tableObj, orderedInputs);

	//desnha tabela calculos de tendencia central
	let centralTendency = calcCentralTendency(tableObj, descriptiveClass, orderedInputs);
	drawCentralTendencyTable(centralTendency);	

	//desenha separatriz
	drawSeparatrizDiv();
	
	//se possivel mostra desvio padrao e coeficiente de variacao
	if(descriptiveClass == "SIMPLE-NUMBER" || descriptiveClass == "INTERVAL-NUMBER"){
		let desvioPadrao = calcDesvioPadrao(tableObj, descriptiveClass, orderedInputs.length, centralTendency.media, populacaoAmostra);
		drawDesvioPadraoTable(desvioPadrao, centralTendency.media);
	}
	
	//adiciona a tabela e o grafico de acordo com o tipo de variavel
	if(descriptiveClass != "INTERVAL-NUMBER"){
		if(descriptiveClass == "SIMPLE-TEXT"){
			//tabela simples texto
			drawSimpleTextTable(tableObj, varName);	

			//grafico pizza
			drawPieChart(tableObj, varName);
		} else if(descriptiveClass == "SIMPLE-NUMBER"){
			//tabela simples numero
			drawSimpleNumberTable(tableObj, varName);

			//grafico de colunas
			drawColumnChart(tableObj, varName);
		}
	} else {
		//tabela de intervalos
		drawIntervalTable(tableObj, varName);
		
		//grafico histograma
		drawIntervalChart(orderedInputs, tableObj, varName);
	}	
}

function getClass(inputs, varQtd, minQtd = 7) { //Função para retornar o tipo da variavél a ser trabalhada
	let aux = [];
	let varClass;
	
	for(let i = 0; i < inputs.length; i++){
		aux[i] = isNaN(inputs[i]) ? 0 : 1;
	}
	
	if(aux.indexOf(0) == 0 && aux.indexOf(1) == -1){
		varClass = "SIMPLE-TEXT";
	} else if(aux.indexOf(0) == -1 && aux.indexOf(1) == 0){
		if(varQtd > minQtd){
			varClass = "INTERVAL-NUMBER";
		} else {
			varClass = "SIMPLE-NUMBER";
		}
	} else {
		varClass = "ERROR";
	}
	return varClass;
}

function getSimple(inputs){ //cria uma tabela simples(nome da variavel e frequencia simples)
	let vetQtd = [];
	let findFlag = false, findPos = -1;
	
	for(let i = 0; i < inputs.length; i++){
		for(let j = 0; j < vetQtd.length; j++){
			if(inputs[i] == vetQtd[j].name){
				findFlag = true;
				findPos = j;
			}
		}
		if(findFlag){			
			vetQtd[findPos].qtd += 1;
			findFlag = false;
		} else {
			let obj = {};
			obj.name = inputs[i];
			obj.qtd = 1;
			vetQtd.push(obj);
		}		
	}
	return vetQtd;
}

function getInterval(vetQtd, inputs){ //cria uma tabela com intervalos (minimo, maximo e frequencia simples)
	//calculos para definir linhas e intervalos
	let minAll = vetQtd[0].name;
	let maxAll = vetQtd[vetQtd.length-1].name
	let At = maxAll - minAll;	
	let K = Math.floor(Math.sqrt(inputs.length));
	let vetK = [K-1, K, K+1];
	
	for(let i = At+1; i != 0; i++){
		if(i%vetK[0] == 0){
			At = i;
			K = vetK[0];
			break;
		} else if(i%vetK[1] == 0){
			At = i;
			K = vetK[1];
			break;
		} else if(i%vetK[2] == 0){
			At = i;
			K = vetK[2];
			break;
		}
	}
	let Ic = At/K;	

	//calculo da frequencia
	let vetIntervals = [];
	let minIntervals = minAll;
	let maxIntervals = minAll + Ic;
	for(let i = 0; i < K; i++){		
		let obj = {min: minIntervals, max: maxIntervals, qtd: 0};
		for(let j = 0; j < vetQtd.length; j++){
			if(vetQtd[j].name >= obj.min && vetQtd[j].name < obj.max){
				obj.qtd += vetQtd[j].qtd;
			}			
		}
		vetIntervals.push(obj);
		minIntervals = maxIntervals;
		maxIntervals = minIntervals + Ic;
	}
	return vetIntervals;
}

function addFreqs(tableObj, inputs){ //adciona as frequencias para uma tabela ja criada, simples ou de intervalos
	let totalQtd = inputs.length;	
	let prevfRp = 0;
	let prevFac = 0;
	let prevFacp = 0;
	let round = 0;

	for(let obj of tableObj){
		//percentual individual
		obj.fRp = Math.round(((obj.qtd*100)/totalQtd)* 100) / 100;

		//frequencia acumulada
		obj.Fac = prevFac + obj.qtd;
		prevFac = obj.Fac;

		//frequencia acumulada percentual
		round = Math.round(prevFacp * 100) / 100;
		obj.Facp = Math.round((round + obj.fRp) * 100) / 100;
		prevFacp = obj.Facp;
	}	
}

function calcCentralTendency(tableObj, descriptiveClass, inputs){//faz os calculos de tendencia central
	let obj = {
		media: null,
		moda: null,
		mediana: null
	}

	obj.media = calcMedia(tableObj, descriptiveClass, inputs.length);
	obj.moda = calcModa(tableObj, descriptiveClass);
	obj.mediana = calcMediana(tableObj, descriptiveClass, inputs.length);

	return obj;
}

function calcMedia(tableObj, descriptiveClass, numElements){ //calcula media

	let sum = 0;
	let midPoint = 0;

	if(descriptiveClass == "SIMPLE-TEXT"){
		return "Não existe Média";
	} else if(descriptiveClass == "SIMPLE-NUMBER"){		
		for(let obj of tableObj){
			sum += obj.name * obj.qtd;
		}		
	} else if(descriptiveClass == "INTERVAL-NUMBER"){
		for(let obj of tableObj){
			midPoint = (obj.min + obj.max)/2;
			sum += midPoint * obj.qtd;
		}
	}
	return Math.round((sum/numElements) * 100) / 100;
}

function calcModa(tableObj, descriptiveClass){ //calcula moda
	let moda = [];
	let maxRep = 0;
	let aux = 0;

	for(let obj of tableObj){
		aux = obj.qtd;
		if(aux > maxRep){
			maxRep = aux;
		}
	}
	for(let obj of tableObj){
		if(obj.qtd == maxRep){
			if(descriptiveClass == "INTERVAL-NUMBER"){
				moda.push((obj.min + obj.max)/2);
			} else {
				moda.push(obj.name);
			}
		}
	}
	if(moda.length == tableObj.length){
		return "Não existe Moda";
	} else {
		return moda;
	}	
}

function calcMediana(tableObj, descriptiveClass, numElements){ //calcula mediana
	let mediana = [];
	let medianaPos = [];
	let medianaVal = [];
	let prevFac = 0;

	if(numElements % 2 == 0){
		medianaPos.push(numElements/2);
		medianaPos.push((numElements/2)+1);
	}else {
		medianaPos.push((numElements + 1) / 2);
	}

	if(descriptiveClass == "SIMPLE-TEXT" || descriptiveClass == "SIMPLE-NUMBER"){
		for(let pos of medianaPos){
			for(let obj of tableObj){
				if(pos <= obj.Fac){
					medianaVal.push(obj.name);
					break;
				}
			}
		}
		if(descriptiveClass == "SIMPLE-NUMBER" && medianaVal.length > 1){
			mediana.push((medianaVal[0] + medianaVal[1])/2);
		} else {
			mediana = medianaVal;
		}
	}else if(descriptiveClass == "INTERVAL-NUMBER"){
		for(let obj of tableObj){
			if(medianaPos[0] <= obj.Fac){
				let calcMd = obj.min + (((medianaPos[0] - prevFac) / obj.qtd ) * (obj.max - obj.min));
				mediana.push(calcMd);
				break;
			}
			prevFac = obj.Fac;
		}
	}
	if(mediana.length == 1){
		if(isNaN(mediana[0])){
			return mediana[0];
		} else {
			return Math.round(mediana[0] * 100) / 100;
		}		
	} else {
		if(mediana[0] == mediana[1]){
			return mediana[0];
		} else {
			return mediana;
		}
	}
	
}
function calcDesvioPadrao(tableObj, descriptiveClass, numElements, media, populacaoAmostra){ //calcula desvio padrao
	let somatoria = 0;
	let desvioPadrao = 0;

	if(descriptiveClass == "SIMPLE-NUMBER"){
		for(let obj of tableObj){
			somatoria += (Math.pow((obj.name - media), 2)) * obj.qtd;
		}		
	} else if(descriptiveClass == "INTERVAL-NUMBER"){
		for(let obj of tableObj){
			somatoria += (Math.pow(((obj.max + obj.min) / 2) - media, 2)) * obj.qtd;
		}
	}
	if(populacaoAmostra == "populacao"){
		desvioPadrao = Math.sqrt(somatoria/numElements);
	} else {
		desvioPadrao = Math.sqrt(somatoria/(numElements - 1));
	}

	return Math.round(desvioPadrao * 100) / 100;
}

function callSeparatriz(){// gera os input:range de acordo com a separatriz e ja mostra valor
	$("#sepTipo").html("");
	$("#sepValor").html("");
	
	let sep = $("#separatrizSelect").val();
	let tipo = $("#separatrizSelect option:selected" ).text();
	let marcas = [];
	let passo = 100/sep;
	
	$("#sepTipo").html(tipo);
	
	if(sep > 0 && sep < 100){				
		for(let i = passo; i <= 100; i += passo){
			marcas.push(i);
		}
		$("#rangeInput").slider('destroy');
		$("#rangeInput").slider({
			ticks: marcas,
			ticks_labels: marcas,
			step: passo,
			min: marcas[0],
			max: 100,
			tooltip: 'hide',
		});
		let valor = $('#rangeInput').data('slider').getValue();
		$("#sepValor").html(valor);
		
		$("#sepResult").html(calcSeparatriz(tableObj, descriptiveClass, orderedInputs.length, parseInt(valor)));
	} else if(sep == 100){
		$("#rangeInput").slider('destroy');
		$("#rangeInput").slider({
			step: 1,
			min: 1,
			max: 100,
			value: 1,
			tooltip: 'always',
			tooltip_position: 'bottom'
		});
		let valor = $('#rangeInput').data('slider').getValue();
		$("#sepValor").html(valor);
		
		$("#sepResult").html(calcSeparatriz(tableObj, descriptiveClass, orderedInputs.length, parseInt(valor)));
	} else {
		$("#rangeInput").slider('destroy');
		$("#rangeInput").css("display", "none");
		$("#sepTipo").html("");
		$("#sepValor").html("");
		$("#sepResult").html("");
	}	
	let valor = $('#rangeInput').data('slider').getValue();
	$("#sepValor").html(valor);
	
	$('#rangeInput').slider().on('change', function(ev){
		let valor = $('#rangeInput').data('slider').getValue();
		$("#sepValor").html(valor);
		
		$("#sepResult").html(calcSeparatriz(tableObj, descriptiveClass, orderedInputs.length, parseInt(valor)));				
	});
}

function calcSeparatriz(tableObj, descriptiveClass, numElements, percentil){ //calcula valor separatriz

	let percentilPos = numElements * (percentil/100);
	let separatriz = undefined;
	let prevFac = 0;

	if(descriptiveClass != "INTERVAL-NUMBER"){
		for(let obj of tableObj){
			if(percentilPos <= obj.Fac){
				separatriz = obj.name;
				break;
			}
		}
	} else {
		for(let obj of tableObj){
			if(percentilPos <= obj.Fac){
				let calcMd = obj.min + (((percentilPos - prevFac) / obj.qtd ) * (obj.max - obj.min));
				separatriz = calcMd;
				break;
			}
			prevFac = obj.Fac;
		}
	}	
	if(isNaN(separatriz)){
		return separatriz;
	} else {
		return Math.round(separatriz * 100) / 100;
	}
}
//##############################################   UPLOAD
function handleFiles(files) {
	// Arquivo suportado?
	if (window.FileReader) {
		getAsText(files[0]);
	} else {
		alert('Arquivo não suportado!');
	}
}

function getAsText(fileToRead) {
	let reader = new FileReader();
	
	// Carrega a leitura do arquivo
	reader.onload = loadHandler;
	// Retorna possiveis erros
	reader.onerror = errorHandler;
	// Traz o arquivo para leitura  
	reader.readAsText(fileToRead);
}

function loadHandler(event) {
	let csv = event.target.result;
	processData(csv);             
}

function processData(csv) {
	
	let fullPath = document.getElementById('btnDescritivaImportada').value;
	if (fullPath) {
		var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
		var filename = fullPath.substring(startIndex);
		if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
			filename = filename.substring(1);
		}
		//
	}
	// 
	/*lidar com linhas*/
	let allTextLines = csv.split(/\r\n|\n/);
	let line1, line2;
	if(allTextLines.length > 2){
		line1 = allTextLines[0].replace(",", ".");
		line2 = allTextLines[1].replace(",", ".");
		document.getElementById("dataXInput").value = line1;
		document.getElementById("dataYInput").value = line2;
	} else {
		line1 = allTextLines[0].replace(",", ".");
		document.getElementById("dataVar").value = filename;
		document.getElementById("dataInput").value = line1;
	}
	/*
	while (allTextLines.length) {
		lines.push(allTextLines.shift().split(','));
	}
	*/
}

function errorHandler(evt) {
	if(evt.target.error.name == "NotReadableError") {
		alert("Não foi possível ler o arquivo!");
	}
}
