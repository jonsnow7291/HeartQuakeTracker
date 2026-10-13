import Foundation
import UIKit
import React

/**
 * Módulo nativo iOS de monitoreo de Batería (PowerService real).
 * Proporciona el nivel exacto de batería y notifica cambios de porcentaje y conexión de carga.
 * Nota de brief: iOS sin verificar (entorno Linux sin toolchain de Xcode).
 */
@objc(PowerModule)
class PowerModule: RCTEventEmitter {

  private var hasListeners = false

  override init() {
    super.init()
    UIDevice.current.isBatteryMonitoringEnabled = true
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(batteryChanged),
      name: UIDevice.batteryLevelDidChangeNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(batteryChanged),
      name: UIDevice.batteryStateDidChangeNotification,
      object: nil
    )
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["onBatteryChanged"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc
  private func batteryChanged() {
    guard hasListeners else { return }
    let level = getBatteryLevel()
    let charging = isCharging()
    sendEvent(withName: "onBatteryChanged", body: ["level": level, "charging": charging])
  }

  private func getBatteryLevel() -> Int {
    let raw = UIDevice.current.batteryLevel
    if raw < 0 { return 100 }
    return Int(raw * 100.0)
  }

  private func isCharging() -> Bool {
    let state = UIDevice.current.batteryState
    return state == .charging || state == .full
  }

  @objc(getBatteryStatus:rejecter:)
  func getBatteryStatus(resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let level = getBatteryLevel()
    let charging = isCharging()
    resolver(["level": level, "charging": charging])
  }
}
