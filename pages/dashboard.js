import { useState } from 'react';
import * as XLSX from 'xlsx';

function filtrarChamadosPorPeriodo(chamados, nomeProvedor, dataInicio, dataFim) {
  return chamados.filter(c => {
    if (c.provedor !== nomeProvedor) return false;
    const dataChamado = new Date(c.data);
    return dataChamado >= new Date(dataInicio) && dataChamado <= new Date(dataFim);
  });
}

function calcularValorNegociacao(chamados, nomeProvedor) {
  const n1 = chamados.filter(c => c.valorAtendimento === '3,50' || c.valorAtendimento === '5,50').length;
  const n2 = chamados.filter(c => c.valorAtendimento === '4,50' || c.valorAtendimento === '6,50').length;
  const venda = chamados.filter(c => [
    '99,90','109,90','119,90','129,90','139,90','149,90','159,90','199,90'
  ].includes(c.valorAtendimento)).length;
  const massivo = chamados.filter(c => c.valorAtendimento === '1,50').length;

  if (nomeProvedor === 'Mynet') {
    const fixo = 500;
    const valorVendaUnitario = 119.90;
    const valorTotal = fixo 
      + (n1 * 3.5) 
      + (n2 * 4.5) 
      + (venda * valorVendaUnitario * 0.3) 
      + (massivo * 1.5);
    return { fixo, n1, n2, venda, massivo, valorTotal };
  }

  if (nomeProvedor === 'Bkup') {
    const fixo = 1100;
    const franquia = 200;
    const chamadosCobranca = n1 + n2 + venda;
    const chamadosAcimaFranquia = Math.max(0, chamadosCobranca - franquia);
    const valorPorChamado = ((3.5 + 4.5) / 2);
    const valorVendaUnitario = 119.90;
    const valorTotal = fixo 
