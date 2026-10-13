import Foundation
import CoreBluetooth
import React

@objc(BleAdvertiser)
class BleAdvertiser: NSObject, CBPeripheralManagerDelegate {
  private var peripheralManager: CBPeripheralManager?
  private var isAdv: Bool = false
  private var pendingResolve: RCTPromiseResolveBlock?
  private var pendingReject: RCTPromiseRejectBlock?
  private var pendingPayload: [String: Any]?

  override init() {
    super.init()
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func startAdvertising(
    _ manufacturerId: NSNumber,
    payloadBase64: String,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    if peripheralManager == nil {
      peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
    }

    let serviceUUID = CBUUID(string: "0000EA74-0000-1000-8000-00805F9B34FB")
    let advData: [String: Any] = [
      CBAdvertisementDataServiceUUIDsKey: [serviceUUID],
      CBAdvertisementDataLocalNameKey: "EQTR"
    ]

    guard let manager = peripheralManager else {
      rejecter("BLE_ERROR", "No se pudo inicializar CBPeripheralManager", nil)
      return
    }

    if manager.state == .poweredOn {
      if isAdv {
        manager.stopAdvertising()
      }
      manager.startAdvertising(advData)
      isAdv = true
      resolver(true)
    } else if manager.state == .poweredOff {
      rejecter("BLUETOOTH_OFF", "Bluetooth apagado en iOS", nil)
    } else {
      pendingPayload = advData
      pendingResolve = resolver
      pendingReject = rejecter
    }
  }

  @objc
  func stopAdvertising(
    _ resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    if let manager = peripheralManager, isAdv {
      manager.stopAdvertising()
    }
    isAdv = false
    pendingPayload = nil
    pendingResolve = nil
    pendingReject = nil
    resolver(true)
  }

  @objc
  func isAdvertising(
    _ resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    resolver(isAdv)
  }

  // MARK: - CBPeripheralManagerDelegate
  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    if peripheral.state == .poweredOn {
      if let data = pendingPayload, let resolve = pendingResolve {
        peripheral.startAdvertising(data)
        isAdv = true
        resolve(true)
        pendingPayload = nil
        pendingResolve = nil
        pendingReject = nil
      }
    } else if peripheral.state == .poweredOff {
      isAdv = false
      if let reject = pendingReject {
        reject("BLUETOOTH_OFF", "Bluetooth apagado en iOS", nil)
        pendingPayload = nil
        pendingResolve = nil
        pendingReject = nil
      }
    }
  }

  func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager, error: Error?) {
    if let err = error {
      isAdv = false
      pendingReject?("ADVERTISE_FAILED", err.localizedDescription, err)
    } else {
      isAdv = true
      pendingResolve?(true)
    }
    pendingResolve = nil
    pendingReject = nil
  }
}
