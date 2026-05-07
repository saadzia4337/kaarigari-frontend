package com.kaarigari

import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import java.io.File

/**
 * ML Kit pose on a saved snapshot file (used with VisionCamera preview snapshots — no frame processors).
 */
class PoseDetectModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val detector by lazy {
    val opt =
      PoseDetectorOptions.Builder()
        .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
        .build()
    PoseDetection.getClient(opt)
  }

  override fun getName(): String = "PoseDetectModule"

  @ReactMethod
  fun detectPoseFromImagePath(imagePath: String, promise: Promise) {
    try {
      val path = imagePath.removePrefix("file://")
      val file = File(path)
      if (!file.exists()) {
        promise.reject("E_PATH", "Image not found: $path")
        return
      }
      val uri = Uri.fromFile(file)
      val image = InputImage.fromFilePath(reactContext, uri)
      val pose = Tasks.await(detector.process(image))

      val left = pose.getPoseLandmark(PoseLandmark.LEFT_SHOULDER)
      val right = pose.getPoseLandmark(PoseLandmark.RIGHT_SHOULDER)

      val map = Arguments.createMap()
      map.putInt("width", image.width)
      map.putInt("height", image.height)

      if (left != null &&
        right != null &&
        left.inFrameLikelihood > 0.35f &&
        right.inFrameLikelihood > 0.35f
      ) {
        val w = image.width.coerceAtLeast(1)
        val h = image.height.coerceAtLeast(1)
        map.putBoolean("found", true)
        map.putDouble("lsNx", left.position.x.toDouble() / w)
        map.putDouble("lsNy", left.position.y.toDouble() / h)
        map.putDouble("rsNx", right.position.x.toDouble() / w)
        map.putDouble("rsNy", right.position.y.toDouble() / h)
      } else {
        map.putBoolean("found", false)
      }
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("E_POSE", e.message, e)
    }
  }
}
