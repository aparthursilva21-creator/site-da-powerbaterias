import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatSosMessage } from '../src/client/support.js'

test('Power SOS inclui os campos conhecidos e preserva caracteres do relato', () => {
  const result = formatSosMessage({
    name: 'Pessoa Teste',
    issue: 'Meu carro não liga',
    vehicle: 'Veículo de QA',
    year: 2020,
    description: 'Motor não dá partida & painel acende'
  })
  assert.match(result, /Nome: Pessoa Teste/)
  assert.match(result, /Atendimento: Meu carro não liga/)
  assert.match(result, /Veículo: Veículo de QA/)
  assert.match(result, /Ano: 2020/)
  assert.match(result, /Problema: Motor não dá partida & painel acende/)
  assert.doesNotMatch(result, /Endereço|Localização/)
})

test('Power SOS normaliza quebras internas, limita entradas e ignora campos inválidos', () => {
  const result = formatSosMessage({
    name: ' Pessoa\nTeste\u0000 ',
    year: '20X2',
    address: 'A'.repeat(250),
    location: { latitude: 92, longitude: -48.084 }
  })
  assert.match(result, /Nome: Pessoa Teste\n/)
  assert.doesNotMatch(result, /[\u0000]|Ano:|Localização/)
  assert.equal(result.split('Endereço ou referência: ')[1].length, 220)
})

test('Power SOS reduz precisão da localização fornecida explicitamente', () => {
  const result = formatSosMessage({
    location: { latitude: -15.8734189, longitude: -48.0865273 }
  })
  const map = new URL(result.split('Localização aproximada: ')[1])
  assert.equal(map.hostname, 'www.google.com')
  assert.equal(map.searchParams.get('query'), '-15.873, -48.087')
  assert.doesNotMatch(result, /8734189|0865273/)
})
