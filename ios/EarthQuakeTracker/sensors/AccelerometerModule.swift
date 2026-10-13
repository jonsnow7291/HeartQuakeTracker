import Foundation
import CoreMotion
import React

/**
 * Módulo nativo iOS de muestreo del acelerómetro a ~50 Hz (RF-09, D-18).
 * Utiliza CoreMotion (CMMotionManager) y emite lecturas a JS mediante RCTEventEmitter.
 * Nota de brief: iOS sin verificar (entorno Linux sin toolchain de Xcode).
 */
@objc(AccelerometerModule)
class AccelerometerModule: RCTEventEmitter {

  private let motionManager = CMMotionManager()
  private var hasListeners = false
  private let gravityEarth = 9.80665

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return ["onAccelerometerData"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
    stopSampling()
  }

  @objc
  func isAvailable(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(motionManager.isAccelerometerAvailable)
  }

  @objc
  func start(_ rateHz: Double, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard motionManager.isAccelerometerAvailable else {
      reject("NO_SENSORS", "Acelerómetro no disponible en este dispositivo", nil)
      return
    }

    let hz = rateHz > 0 ? rateHz : 50.0
    motionManager.accelerometerUpdateInterval = 1.0 / hz

    motionManager.startAccelerometerUpdates(to: .main) { [weak self] (data, error) in
      guard let self = self, self.hasListeners, let data = data else { return }

      // CMMotionManager reporta en gravedades (g); convertimos a m/s² para paridad con Android
      let body: [String: Any] = [
        "x": data.acceleration.x * self.gravityEarth,
        "y": data.acceleration.y * self.gravityEarth,
        "z": data.acceleration.z * self.gravityEarth,
        "timestamp": Date().timeIntervalSince1970 * 1000.0
      ]

      self.sendEvent(withName: "onAccelerometerData", body: body)
    }

    resolve(nil)
  }

  @objc
  func stop() {
    stopSampling()
  }

  private func stopSampling() {
    if motionManager.isAccelerometerActive {
      motionManager.stopAccelerometerUpdates()
    }
  }
}
