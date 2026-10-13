import Foundation
import AVFoundation
import AudioToolbox
import React

/**
 * Módulo nativo iOS de Señalización de Rescate (RF-06, RNF-05).
 * Controla la linterna estroboscópica a 4 Hz (AVCaptureDevice),
 * tono acústico puro continuo de 3 kHz (AVAudioEngine) y modo bajo consumo.
 * Nota de brief: iOS sin verificar (entorno Linux sin toolchain de Xcode).
 */
@objc(SignalingModule)
class SignalingModule: NSObject {

  private var torchTimer: DispatchSourceTimer?
  private var isTorchOn = false
  private var isLowPower = false
  private var tickCounter = 0

  private var audioEngine: AVAudioEngine?
  private var isPlayingTone = false

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  private func setTorchInternal(on: Bool) {
    guard let device = AVCaptureDevice.default(for: .video), device.hasTorch else {
      return
    }
    do {
      try device.lockForConfiguration()
      device.torchMode = on ? .on : .off
      device.unlockForConfiguration()
      self.isTorchOn = on
    } catch {
      self.isTorchOn = false
    }
  }

  private func startStrobeInternal(lowPower: Bool) {
    stopStrobeInternal()
    self.isLowPower = lowPower
    self.tickCounter = 0

    let queue = DispatchQueue(label: "com.earthquaketracker.strobe", qos: .userInteractive)
    let timer = DispatchSource.makeTimerSource(queue: queue)
    timer.schedule(deadline: .now(), repeating: .milliseconds(125))

    timer.setEventHandler { [weak self] in
      guard let self = self else { return }
      if self.isLowPower {
        self.tickCounter = (self.tickCounter + 1) % 16
        let shouldBeOn = (self.tickCounter == 0)
        self.setTorchInternal(on: shouldBeOn)
      } else {
        self.isTorchOn.toggle()
        self.setTorchInternal(on: self.isTorchOn)
      }
    }

    timer.resume()
    self.torchTimer = timer
  }

  private func stopStrobeInternal() {
    torchTimer?.cancel()
    torchTimer = nil
    setTorchInternal(on: false)
  }

  private func startToneInternal(frequencyHz: Double = 3000.0, volume: Float = 1.0) {
    if isPlayingTone { return }

    let engine = AVAudioEngine()
    let mainMixer = engine.mainMixerNode
    let sampleRate = mainMixer.outputFormat(forBus: 0).sampleRate

    var currentPhase: Double = 0.0
    let phaseIncrement = (2.0 * Double.pi * frequencyHz) / sampleRate

    let srcNode = AVAudioSourceNode { _, _, frameCount, audioBufferList -> OSStatus in
      let ablPointer = UnsafeMutableAudioBufferListPointer(audioBufferList)
      for frame in 0..<Int(frameCount) {
        let value = Float(sin(currentPhase)) * volume
        currentPhase += phaseIncrement
        if currentPhase >= 2.0 * Double.pi {
          currentPhase -= 2.0 * Double.pi
        }
        for buffer in ablPointer {
          let buf: UnsafeMutableBufferPointer<Float> = UnsafeMutableBufferPointer(buffer)
          buf[frame] = value
        }
      }
      return noErr
    }

    engine.attach(srcNode)
    engine.connect(srcNode, to: mainMixer, format: mainMixer.outputFormat(forBus: 0))

    do {
      try AVAudioSession.sharedInstance().setCategory(.playback, mode: .voicePrompt, options: [.mixWithOthers, .duckOthers])
      try AVAudioSession.sharedInstance().setActive(true)
      try engine.start()
      self.audioEngine = engine
      self.isPlayingTone = true
    } catch {
      self.isPlayingTone = false
    }
  }

  private func stopToneInternal() {
    if let engine = audioEngine {
      engine.stop()
      audioEngine = nil
    }
    isPlayingTone = false
  }

  @objc(startSignaling:resolver:rejecter:)
  func startSignaling(lowPower: Bool, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    startStrobeInternal(lowPower: lowPower)
    startToneInternal(frequencyHz: 3000.0, volume: 1.0)
    resolver(true)
  }

  @objc(stopSignaling:rejecter:)
  func stopSignaling(resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    stopStrobeInternal()
    stopToneInternal()
    resolver(true)
  }

  @objc(updateLowPower:resolver:rejecter:)
  func updateLowPower(lowPower: Bool, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    self.isLowPower = lowPower
    self.tickCounter = 0
    resolver(true)
  }

  @objc(setTorch:resolver:rejecter:)
  func setTorch(on: Bool, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    setTorchInternal(on: on)
    resolver(true)
  }

  @objc(playTone:volume:resolver:rejecter:)
  func playTone(frequencyHz: Double, volume: Double, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    startToneInternal(frequencyHz: frequencyHz, volume: Float(volume))
    resolver(true)
  }

  @objc(stopTone:rejecter:)
  func stopTone(resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    stopToneInternal()
    resolver(true)
  }

  @objc(isMuted:rejecter:)
  func isMuted(resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let volume = AVAudioSession.sharedInstance().outputVolume
    resolver(volume == 0)
  }
}
