
// agos codes
#include "MatrixAnimation.h"
#include <WiFi.h>
#include <R4HttpClient.h>
#include <ArduinoJson.h>
#include <ArduinoJson.hpp>


// WiFi credentials - CHANGE THESE
const char* ssid = "PLDTHOMEFIBRcalcifer";
const char* password = "PLDTsWeetneZuko-12";
const char* serverURL = "http://178.128.83.244:3000/api/arduino-data";

// Pin definitions for Ultrasonic Sensor 1
const int TRIG_PIN_1 = 2;  // Change these pins according to your wiring
const int ECHO_PIN_1 = 3;

// Pin definitions for Ultrasonic Sensor 2
const int TRIG_PIN_2 = 4;  // Change these pins according to your wiring
const int ECHO_PIN_2 = 5;

// Timing for WiFi updates
unsigned long lastWiFiSend = 0;
const unsigned long WIFI_INTERVAL = 5000; // Send every 5 seconds

// Function to get distance from ultrasonic sensor

// Function to get distance from ultrasonic sensor
float getDistance(int trigPin, int echoPin) {
  // Clear the trigger pin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Set trigger pin high for 10 microseconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read the echo pin
  long duration = pulseIn(echoPin, HIGH);

  // Calculate distance in centimeters
  // Speed of sound = 343 meters/second = 0.0343 cm/microsecond
  // Distance = (duration * speed of sound) / 2
  float distance = duration * 0.0343 / 2;

  return distance;
}

void setup() {
  // Initialize Serial communication
  Serial.begin(115200);

  // Initialize LED Matrix
  initMatrix();

  // Initialize Ultrasonic Sensor pins
  pinMode(TRIG_PIN_1, OUTPUT);
  pinMode(ECHO_PIN_1, INPUT);
  pinMode(TRIG_PIN_2, OUTPUT);
  pinMode(ECHO_PIN_2, INPUT);

  // Initialize WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Get distances from both sensors
  float distance1 = getDistance(TRIG_PIN_1, ECHO_PIN_1);
  float distance2 = getDistance(TRIG_PIN_2, ECHO_PIN_2);

  // Print distances to Serial Monitor with fixed decimal places
  Serial.print("Distance Readings:\n");
  Serial.print("Sensor 1: ");
  Serial.print(distance1, 1);  // Show 1 decimal place
  Serial.print(" cm\n");
  Serial.print("Sensor 2: ");
  Serial.print(distance2, 1);  // Show 1 decimal place
  Serial.print(" cm\n");
  Serial.println("------------------------");  // Separator line

  // Send data via WiFi every 5 seconds
  if (millis() - lastWiFiSend >= WIFI_INTERVAL) {
    if (WiFi.status() == WL_CONNECTED) {
      sendDataToServer(distance1, distance2);
    }
    lastWiFiSend = millis();
  }

  // Add a small delay to make the output more readable
  delay(100);

  // Update matrix animation
  updateMatrixAnimation();
}

// Function to send data to server
void sendDataToServer(float dist1, float dist2) {
  WiFiSSLClient sslClient;
  R4HttpClient http;

  // R4HttpClient requires WiFiSSLClient and String for begin()
  String url = String(serverURL);
  http.begin(sslClient, url);

  // R4HttpClient addHeader expects a single formatted string
  http.addHeader("Content-Type: application/json");

  StaticJsonDocument<200> doc;
  doc["distance1"] = dist1;  // This will become waterLevel in frontend
  doc["distance2"] = dist2;  // Backup sensor
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.print("HTTP Response: ");
    Serial.println(httpCode);
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpCode);
  }

  // R4HttpClient doesn't have end() method - connection closes automatically
}

