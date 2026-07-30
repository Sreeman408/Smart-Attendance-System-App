import React, { useState } from 'react';
import { Smartphone, Check, Copy, Terminal, Shield, Download, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CapacitorGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'permissions'>('android');
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(label);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mobile App Build Guide (Capacitor)" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Intro banner */}
        <div className="p-3 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-700/80 rounded-xl">
              <Smartphone className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Native Android & iOS Build</h4>
              <p className="text-xs text-indigo-200">100% Free native conversion using Capacitor</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold rounded-full">
            Ready to Build
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🤖 Android APK (.apk)
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🍎 iOS App (.ipa)
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'permissions'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📷 Camera & Config
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'android' && (
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-medium">Run these commands in your local terminal to build the Android APK:</p>

            <div className="space-y-2">
              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2 font-mono text-[11px] relative border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                  <span>Step 1: Install Capacitor CLI & Android Platform</span>
                  <button
                    onClick={() => copyToClipboard('npm install @capacitor/core @capacitor/cli @capacitor/android && npx cap add android', 'step1')}
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    {copiedStep === 'step1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedStep === 'step1' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <code>npm install @capacitor/core @capacitor/cli @capacitor/android</code><br/>
                <code>npx cap add android</code>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2 font-mono text-[11px] relative border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                  <span>Step 2: Build Web App & Sync Assets</span>
                  <button
                    onClick={() => copyToClipboard('npm run build && npx cap sync', 'step2')}
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    {copiedStep === 'step2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedStep === 'step2' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <code>npm run build</code><br/>
                <code>npx cap sync</code>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2 font-mono text-[11px] relative border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                  <span>Step 3: Open in Android Studio & Generate APK</span>
                  <button
                    onClick={() => copyToClipboard('npx cap open android', 'step3')}
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    {copiedStep === 'step3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedStep === 'step3' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <code>npx cap open android</code>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-900 dark:text-indigo-300">
              <span className="font-bold">In Android Studio:</span> Go to <span className="font-semibold">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</span> to output the ready-to-install <code className="bg-indigo-100 dark:bg-indigo-900/60 px-1 py-0.5 rounded text-[10px]">app-debug.apk</code> file!
            </div>
          </div>
        )}

        {activeTab === 'ios' && (
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-medium">Commands to package for iOS (requires macOS & Xcode):</p>

            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2 font-mono text-[11px] relative border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                <span>iOS Capacitor Commands</span>
                <button
                  onClick={() => copyToClipboard('npm install @capacitor/ios && npx cap add ios && npm run build && npx cap sync && npx cap open ios', 'ios')}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  {copiedStep === 'ios' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedStep === 'ios' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <code>npm install @capacitor/ios</code><br/>
              <code>npx cap add ios</code><br/>
              <code>npm run build</code><br/>
              <code>npx cap sync</code><br/>
              <code>npx cap open ios</code>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <p className="font-semibold text-slate-900 dark:text-white">In Xcode:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600 dark:text-slate-300">
                <li>Select target iOS simulator or connected iPhone</li>
                <li>Click the <span className="font-bold">Play (Run)</span> button to launch on device</li>
                <li>Archive for App Store TestFlight distribution</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                AndroidManifest.xml Camera Permission
              </h5>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Add this to <code className="text-indigo-600 dark:text-indigo-400 font-mono">android/app/src/main/AndroidManifest.xml</code> for camera QR scanning:
              </p>
              <pre className="p-2 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto">
{`<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />`}
              </pre>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                iOS Info.plist Camera Privacy Usage
              </h5>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Add this to <code className="text-indigo-600 dark:text-indigo-400 font-mono">ios/App/App/Info.plist</code>:
              </p>
              <pre className="p-2 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto">
{`<key>NSCameraUsageDescription</key>
<string>Academia needs camera access to scan class QR codes for attendance.</string>`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
