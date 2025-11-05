'use client'

import React, { ReactNode, useMemo } from 'react'

/**
 * Feature Flag Configuration
 * Controls whether workstation redesign is enabled
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_WORKSTATION_ENABLED: Controls feature visibility (true/false)
 * - WORKSTATION_LOGGING_ENABLED: Debug logging for troubleshooting
 * - WORKSTATION_PERF_TRACKING: Performance metrics collection
 */

interface WorkstationFeatureFlagConfig {
  enabled: boolean
  loggingEnabled: boolean
  perfTrackingEnabled: boolean
  rolloutPercentage: number
}

/**
 * Get feature flag configuration from environment
 * Returns safe defaults if env vars not set
 */
function getFeatureFlagConfig(): WorkstationFeatureFlagConfig {
  const enabled = process.env.NEXT_PUBLIC_WORKSTATION_ENABLED === 'true'
  const loggingEnabled = process.env.WORKSTATION_LOGGING_ENABLED === 'true'
  const perfTrackingEnabled = process.env.WORKSTATION_PERF_TRACKING === 'true'
  
  // Rollout percentage (0-100) - could come from environment or API
  const rolloutPercentage = Math.min(100, Math.max(0, parseInt(process.env.NEXT_PUBLIC_WORKSTATION_ROLLOUT || '0', 10)))

  return {
    enabled,
    loggingEnabled,
    perfTrackingEnabled,
    rolloutPercentage,
  }
}

/**
 * Determine if user should see workstation based on rollout percentage
 * Uses user ID hash for consistent experience across sessions
 */
function shouldShowWorkstation(userId: string | null, rolloutPercentage: number): boolean {
  if (rolloutPercentage === 100) return true
  if (rolloutPercentage === 0) return false
  
  if (!userId) {
    // If no user ID, use random chance (useful for logged-out previews)
    return Math.random() * 100 < rolloutPercentage
  }

  // Hash user ID to determine if they're in rollout percentage
  // This ensures consistent behavior across sessions
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Use absolute value modulo 100 to get 0-99
  const userHashPercentage = Math.abs(hash) % 100
  return userHashPercentage < rolloutPercentage
}

/**
 * Logs feature flag events for monitoring
 * Only logs if WORKSTATION_LOGGING_ENABLED=true
 */
function logFeatureFlagEvent(event: string, data?: Record<string, unknown>) {
  const config = getFeatureFlagConfig()
  
  if (!config.loggingEnabled) return

  console.log(`[Workstation Flag] ${event}`, data || '')
}

/**
 * Track feature flag performance metrics
 * Sends to Sentry or analytics if enabled
 */
function trackFeatureFlagMetric(metricName: string, value: number) {
  const config = getFeatureFlagConfig()

  if (!config.perfTrackingEnabled) return

  // Could send to Sentry, DataDog, or other APM tool
  // For now, just log it
  if (typeof window !== 'undefined' && (window as any).__SENTRY__) {
    // Send to Sentry if available
    // (window as any).__SENTRY__.captureMessage(`workstation_metric: ${metricName} = ${value}`)
  }
}

interface WorkstationFeatureFlagProps {
  /**
   * User ID for rollout percentage determination
   * If not provided, random rollout will be used
   */
  userId?: string | null
  
  /**
   * Component to render if workstation is enabled
   */
  enabledComponent: ReactNode
  
  /**
   * Component to render if workstation is disabled (falls back to old UI)
   */
  disabledComponent: ReactNode
  
  /**
   * Optional: called when component mounts to report availability
   */
  onFeatureFlagCheck?: (isEnabled: boolean) => void
}

/**
 * WorkstationFeatureFlag Component
 * 
 * Wraps workstation UI with feature flag logic for safe rollout
 * 
 * Usage:
 * ```tsx
 * <WorkstationFeatureFlag
 *   userId={currentUser?.id}
 *   enabledComponent={<WorkstationLayout {...props} />}
 *   disabledComponent={<ExecutiveDashboardTab {...props} />}
 *   onFeatureFlagCheck={(enabled) => console.log('Workstation:', enabled)}
 * />
 * ```
 * 
 * Rollout Stages:
 * - Stage 0: 0% (feature disabled for all)
 * - Stage 1: 10% (early access)
 * - Stage 2: 25% (expanded access)
 * - Stage 3: 50% (general availability)
 * - Stage 4: 100% (full rollout, can remove flag)
 */
export function WorkstationFeatureFlag({
  userId,
  enabledComponent,
  disabledComponent,
  onFeatureFlagCheck,
}: WorkstationFeatureFlagProps) {
  const isEnabled = useMemo(() => {
    const config = getFeatureFlagConfig()
    
    // Check if feature flag is globally enabled
    if (!config.enabled) {
      logFeatureFlagEvent('disabled', { reason: 'globally_disabled' })
      return false
    }

    // Check if user is in rollout percentage
    const userInRollout = shouldShowWorkstation(userId, config.rolloutPercentage)
    
    if (!userInRollout) {
      logFeatureFlagEvent('rollout_excluded', {
        userId,
        rolloutPercentage: config.rolloutPercentage,
      })
      return false
    }

    logFeatureFlagEvent('enabled', {
      userId,
      rolloutPercentage: config.rolloutPercentage,
    })
    return true
  }, [userId])

  // Report flag status on mount
  React.useEffect(() => {
    onFeatureFlagCheck?.(isEnabled)
    trackFeatureFlagMetric('workstation_enabled', isEnabled ? 1 : 0)
  }, [isEnabled, onFeatureFlagCheck])

  return <>{isEnabled ? enabledComponent : disabledComponent}</>
}

/**
 * Hook to check if workstation is enabled
 * Useful for conditional logic within components
 */
export function useWorkstationEnabled(userId?: string | null): boolean {
  return useMemo(() => {
    const config = getFeatureFlagConfig()
    
    if (!config.enabled) return false
    return shouldShowWorkstation(userId, config.rolloutPercentage)
  }, [userId])
}

/**
 * Hook to get current feature flag configuration
 */
export function useFeatureFlagConfig(): WorkstationFeatureFlagConfig {
  return useMemo(() => getFeatureFlagConfig(), [])
}

/**
 * Server-side helper to check if workstation is enabled for a user
 * Use this in server components or API routes
 */
export function isWorkstationEnabledForUser(userId: string | null): boolean {
  const config = getFeatureFlagConfig()
  
  if (!config.enabled) return false
  return shouldShowWorkstation(userId, config.rolloutPercentage)
}

export { getFeatureFlagConfig, shouldShowWorkstation, logFeatureFlagEvent, trackFeatureFlagMetric }
