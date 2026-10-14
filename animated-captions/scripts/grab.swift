import AVFoundation
import AppKit
let a = CommandLine.arguments
let gen = AVAssetImageGenerator(asset: AVURLAsset(url: URL(fileURLWithPath: a[1])))
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
let cg = try gen.copyCGImage(at: CMTime(seconds: Double(a[2])!, preferredTimescale: 600), actualTime: nil)
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[3]))
