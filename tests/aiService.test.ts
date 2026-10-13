import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  isEmergency,
  matchCondition,
  findReportMarkers,
  mentionsReport,
  findMedicine,
  mentionsHealthProblem,
  sourcesFor,
  detectMedSafety,
  isGreeting,
  smallTalkKind,
} from '../src/services/aiService.ts'

/**
 * These tests exercise the deterministic safety and retrieval logic of the AI
 * health assistant. They use only synthetic text — no real patient data.
 * Run with: npm test  (Node's built-in test runner; no extra dependency).
 */

test('emergencies are detected deterministically', () => {
  assert.equal(isEmergency('I have severe chest pain and cannot breathe'), true)
  assert.equal(isEmergency('my father is having a stroke, slurred speech'), true)
  assert.equal(isEmergency('I feel suicidal'), true)
})

test('ordinary symptoms are not misflagged as emergencies', () => {
  assert.equal(isEmergency('I have a mild headache and a runny nose'), false)
  assert.equal(isEmergency('my stomach feels a bit upset'), false)
})

test('health-problem language is recognised', () => {
  assert.equal(mentionsHealthProblem('I have had a fever since yesterday'), true)
  assert.equal(mentionsHealthProblem('I have a sharp sore throat and cough'), true)
  assert.equal(mentionsHealthProblem('What is the capital of France?'), false)
})

test('conditions are matched from symptom language', () => {
  assert.equal(matchCondition('I have had a bad headache all day')?.id, 'headache')
  assert.equal(matchCondition('my stomach is bloated and acidic')?.id, 'stomach')
  assert.equal(matchCondition('loose motions and nausea since morning')?.id, 'gastro')
  assert.equal(matchCondition('completely unrelated sentence'), undefined)
})

test('report markers are extracted from typed values', () => {
  const markers = findReportMarkers('my HbA1c is 7.2% and LDL is 160 mg/dL')
  const names = markers.map((marker) => marker.name).join(' | ')
  assert.ok(markers.length >= 2, `expected at least 2 markers, got: ${names}`)
  assert.ok(names.includes('HbA1c'))
  assert.ok(names.includes('LDL'))
})

test('report intent is recognised without fabricated values', () => {
  assert.equal(mentionsReport('please explain my blood test report'), true)
  assert.equal(mentionsReport('what does my lab result mean'), true)
  assert.equal(mentionsReport('tell me a joke'), false)
})

test('known medicines resolve; unknown ones do not', () => {
  assert.equal(findMedicine('what is metformin used for')?.generic, 'Metformin')
  assert.equal(findMedicine('side effects of paracetamol')?.generic, 'Paracetamol (acetaminophen)')
  assert.equal(findMedicine('a mysterious blue tablet with no name'), undefined)
})

test('medication safety questions are detected', () => {
  assert.equal(detectMedSafety('I missed my dose this morning'), 'missed')
  assert.equal(detectMedSafety('I think I had an allergic reaction to it'), 'allergy')
  assert.equal(detectMedSafety('what is this medicine for'), undefined)
})

test('sources are real https links, never invented citations', () => {
  const sources = sourcesFor('what are the side effects of metformin')
  assert.ok(sources.length > 0)
  for (const source of sources) {
    assert.match(source.url, /^https:\/\//, `source not https: ${source.url}`)
    assert.ok(source.label.length > 0)
  }
})

test('greetings are recognised but ordinary words are not', () => {
  assert.equal(isGreeting('hi'), true)
  assert.equal(isGreeting('Hello!'), true)
  assert.equal(isGreeting('hey there'), true)
  assert.equal(isGreeting('good morning'), true)
  assert.equal(isGreeting('what is the capital of France'), false)
  // "this"/"high"/"which" must not be mistaken for "hi".
  assert.equal(isGreeting('this is a high reading'), false)
  assert.equal(isGreeting('which medicine for a cold'), false)
})

test('small talk is classified for friendly replies', () => {
  assert.equal(smallTalkKind('hi'), 'greeting')
  assert.equal(smallTalkKind('thank you so much'), 'thanks')
  assert.equal(smallTalkKind('what can you do'), 'capabilities')
  assert.equal(smallTalkKind('I have had a fever since yesterday'), null)
})
