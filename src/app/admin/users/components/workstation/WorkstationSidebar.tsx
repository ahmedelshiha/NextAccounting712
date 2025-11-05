'use client'

import React from 'react'
import { WorkstationSidebarProps } from '../../types/workstation'
import './workstation.css'

/**
 * WorkstationSidebar Component
 * Fixed left sidebar (280px) with:
 * - Quick statistics card
 * - Saved views buttons
 * - Advanced user filters
 * - Reset button
 */
export function WorkstationSidebar({
  isOpen = true,
  onClose,
  filters,
  onFiltersChange,
  stats,
  onAddUser,
  onReset,
  className
}: WorkstationSidebarProps) {
  return (
    <div className={`workstation-sidebar-content ${className || ''}`}>
      {stats && (
        <section className="sidebar-section">
          <h3 className="sidebar-title">Quick Stats</h3>
          <div className="sidebar-stats-container">
            <div className="stat-item">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{stats.totalUsers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active</span>
              <span className="stat-value">{stats.activeUsers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{stats.pendingApprovals}</span>
            </div>
          </div>
        </section>
      )}

      <section className="sidebar-section">
        <h3 className="sidebar-title">Saved Views</h3>
        <div className="sidebar-views-container">
          <button className="view-btn">All Users</button>
          <button className="view-btn">Clients</button>
          <button className="view-btn">Team</button>
          <button className="view-btn">Admins</button>
        </div>
      </section>

      {filters !== undefined && (
        <section className="sidebar-section sidebar-filters">
          <h3 className="sidebar-title">Filters</h3>
          <div className="sidebar-filters-container" />
        </section>
      )}

      <div className="sidebar-footer">
        {onReset && (
          <button
            onClick={onReset}
            className="sidebar-reset-btn"
            aria-label="Reset all filters"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  )
}

export default WorkstationSidebar
