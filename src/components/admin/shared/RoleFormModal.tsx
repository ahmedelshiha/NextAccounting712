'use client'

import React, { useState, useCallback, useEffect, useMemo, memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AlertCircle, Loader2, ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { globalEventEmitter } from '@/lib/event-emitter'

interface RoleFormData {
  name: string
  description: string
  permissions: string[]
}

interface Permission {
  id: string
  name: string
  description?: string
  category: string
}

interface RoleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (roleId: string) => void
  mode?: 'create' | 'edit'
  initialData?: Partial<RoleFormData & { id: string }>
  title?: string
  description?: string
}

const PermissionCategoryGroup = memo(function PermissionCategoryGroup({
  category,
  permissions,
  selectedPermissions,
  onTogglePermission,
  isExpanded,
  onToggleExpanded,
  searchQuery,
  isSubmitting,
}: {
  category: string
  permissions: Permission[]
  selectedPermissions: string[]
  onTogglePermission: (id: string) => void
  isExpanded: boolean
  onToggleExpanded: (category: string) => void
  searchQuery: string
  isSubmitting: boolean
}) {
  const filteredPerms = useMemo(() => {
    if (!searchQuery.trim()) return permissions
    const query = searchQuery.toLowerCase()
    return permissions.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description?.toLowerCase().includes(query)
    )
  }, [permissions, searchQuery])

  if (filteredPerms.length === 0) return null

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => onToggleExpanded(category)}
        className="flex items-center w-full p-3 hover:bg-gray-50 font-medium text-sm text-gray-700 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
        )}
        <span className="flex-1 text-left">{category}</span>
        <Badge variant="secondary" className="text-xs">
          {filteredPerms.filter(p => selectedPermissions.includes(p.id)).length}/{filteredPerms.length}
        </Badge>
      </button>

      {isExpanded && (
        <div className="ml-6 space-y-2 py-2 px-3 bg-gray-50">
          {filteredPerms.map((perm) => (
            <div key={perm.id} className="flex items-start gap-2">
              <Checkbox
                id={perm.id}
                checked={selectedPermissions.includes(perm.id)}
                onCheckedChange={() => onTogglePermission(perm.id)}
                disabled={isSubmitting}
                className="mt-1"
              />
              <label
                htmlFor={perm.id}
                className="text-sm cursor-pointer flex-1 py-0.5"
              >
                <div className="font-medium text-gray-900">{perm.name}</div>
                {perm.description && (
                  <div className="text-xs text-gray-500 mt-0.5">{perm.description}</div>
                )}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export const RoleFormModal = React.forwardRef<HTMLDivElement, RoleFormModalProps>(
  function RoleFormModal({
    isOpen,
    onClose,
    onSuccess,
    mode = 'create',
    initialData,
    title,
    description,
  }, ref) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loadingPermissions, setLoadingPermissions] = useState(true)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [formData, setFormData] = useState<RoleFormData>({
      name: initialData?.name || '',
      description: initialData?.description || '',
      permissions: initialData?.permissions || [],
    })

    const defaultTitle = mode === 'create' ? 'Create New Role' : 'Edit Role'
    const defaultDescription = mode === 'create'
      ? 'Create a new role with specific permissions'
      : 'Update role information and permissions'

    // Calculate permission counts by category
    const permissionsByCategory = useMemo(() => {
      return permissions.reduce((acc, perm) => {
        const category = perm.category || 'Other'
        if (!acc[category]) acc[category] = []
        acc[category].push(perm)
        return acc
      }, {} as Record<string, Permission[]>)
    }, [permissions])

    const selectedCount = formData.permissions.length
    const filteredCategories = useMemo(() => {
      if (!searchQuery.trim()) return Object.keys(permissionsByCategory)
      const query = searchQuery.toLowerCase()
      return Object.keys(permissionsByCategory).filter(category =>
        permissionsByCategory[category].some(p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
        )
      )
    }, [permissionsByCategory, searchQuery])

    // Auto-expand categories when searching
    useEffect(() => {
      if (searchQuery.trim()) {
        setExpandedCategories(new Set(filteredCategories))
      }
    }, [searchQuery, filteredCategories])

    // Load available permissions
    useEffect(() => {
      if (!isOpen) return

      const loadPermissions = async () => {
        try {
          setLoadingPermissions(true)
          const response = await fetch('/api/admin/permissions')
          if (!response.ok) throw new Error('Failed to load permissions')
          const data = await response.json()
          setPermissions(Array.isArray(data) ? data : data.permissions || [])
          // Initialize expanded categories with first 3
          const categories = Array.isArray(data) 
            ? [...new Set((data as Permission[]).map(p => p.category))]
            : (data.permissions ? [...new Set(data.permissions.map((p: Permission) => p.category))] : [])
          setExpandedCategories(new Set(categories.slice(0, 3)))
        } catch (err) {
          console.error('Failed to load permissions:', err)
          setPermissions([
            { id: 'users.view', name: 'View Users', category: 'Users', description: 'View user information' },
            { id: 'users.create', name: 'Create Users', category: 'Users', description: 'Create new users' },
            { id: 'users.edit', name: 'Edit Users', category: 'Users', description: 'Edit user information' },
            { id: 'users.delete', name: 'Delete Users', category: 'Users', description: 'Delete users' },
            { id: 'roles.view', name: 'View Roles', category: 'Roles', description: 'View role information' },
            { id: 'roles.create', name: 'Create Roles', category: 'Roles', description: 'Create new roles' },
            { id: 'roles.edit', name: 'Edit Roles', category: 'Roles', description: 'Edit role information' },
            { id: 'roles.delete', name: 'Delete Roles', category: 'Roles', description: 'Delete roles' },
            { id: 'permissions.manage', name: 'Manage Permissions', category: 'Permissions', description: 'Manage system permissions' },
          ])
          setExpandedCategories(new Set(['Users', 'Roles']))
        } finally {
          setLoadingPermissions(false)
        }
      }

      loadPermissions()
    }, [isOpen])

    const handleChange = useCallback((field: keyof RoleFormData, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }))
      setError(null)
    }, [])

    const togglePermission = useCallback((permissionId: string) => {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(p => p !== permissionId)
          : [...prev.permissions, permissionId]
      }))
    }, [])

    const toggleCategory = useCallback((category: string) => {
      setExpandedCategories(prev => {
        const next = new Set(prev)
        if (next.has(category)) {
          next.delete(category)
        } else {
          next.add(category)
        }
        return next
      })
    }, [])

    const validateForm = (): boolean => {
      if (!formData.name.trim()) {
        setError('Role name is required')
        return false
      }
      if (!formData.description.trim()) {
        setError('Role description is required')
        return false
      }
      if (formData.permissions.length === 0) {
        setError('At least one permission must be assigned')
        return false
      }
      return true
    }

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!validateForm()) return

      setIsSubmitting(true)
      try {
        const endpoint = mode === 'create'
          ? '/api/admin/roles'
          : `/api/admin/roles/${initialData?.id}`
        const method = mode === 'create' ? 'POST' : 'PATCH'

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Failed to ${mode === 'create' ? 'create' : 'update'} role`)
        }

        const result = await response.json()

        // Emit event for real-time sync
        if (mode === 'create') {
          globalEventEmitter.emit('role:created', {
            roleId: result.id,
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
            timestamp: Date.now(),
          })
        } else {
          globalEventEmitter.emit('role:updated', {
            roleId: initialData?.id,
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
            timestamp: Date.now(),
          })
        }

        toast.success(
          mode === 'create'
            ? 'Role created successfully'
            : 'Role updated successfully'
        )
        onSuccess?.(result.id)
        onClose()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    }, [formData, mode, initialData?.id, onClose, onSuccess])

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent ref={ref} className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{title || defaultTitle}</DialogTitle>
            <DialogDescription>{description || defaultDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Role Name and Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Senior Accountant"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose and responsibilities of this role"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>
            </div>

            {/* Permissions Section */}
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between">
                <Label>Permissions *</Label>
                {selectedCount > 0 && (
                  <Badge variant="secondary">{selectedCount} selected</Badge>
                )}
              </div>

              {loadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                  {/* Search Box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search permissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-9 pr-8"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Permissions Tree */}
                  <div className="border rounded-lg overflow-y-auto flex-1">
                    {filteredCategories.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-gray-500">
                        <p className="text-sm">No permissions found</p>
                      </div>
                    ) : (
                      filteredCategories.map((category) => (
                        <PermissionCategoryGroup
                          key={category}
                          category={category}
                          permissions={permissionsByCategory[category]}
                          selectedPermissions={formData.permissions}
                          onTogglePermission={togglePermission}
                          isExpanded={expandedCategories.has(category)}
                          onToggleExpanded={toggleCategory}
                          searchQuery={searchQuery}
                          isSubmitting={isSubmitting}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loadingPermissions}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'create' ? 'Create Role' : 'Update Role'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
)

RoleFormModal.displayName = 'RoleFormModal'
