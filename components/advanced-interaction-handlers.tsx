"use client"

import { useState, useMemo } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import {
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  ContrastIcon as Compare,
  Layers,
  Zap,
  CheckCircle,
  X,
} from "lucide-react"

interface AdvancedInteractionProps {
  data: any
  onResponse: (response: any) => void
}

export function SearchableSelectionHandler({ data, onResponse }: AdvancedInteractionProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [additionalInput, setAdditionalInput] = useState("")

  const filteredItems = useMemo(() => {
    if (!searchTerm) return data.items

    return data.items.filter((item: any) =>
      data.search_fields.some((field: string) => item[field]?.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [searchTerm, data.items, data.search_fields])

  const handleItemToggle = (itemId: string) => {
    if (data.multiple) {
      setSelectedItems((prev) =>
        prev.includes(itemId)
          ? prev.filter((id) => id !== itemId)
          : [...prev, itemId].slice(0, data.max_selections || prev.length + 1),
      )
    } else {
      setSelectedItems([itemId])
    }
  }

  const handleSubmit = () => {
    onResponse({
      type: "searchable_selection_response",
      selected_items: selectedItems,
      additional_input: additionalInput || null,
      search_term: searchTerm,
    })
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>{filteredItems.length} items found</span>
          {selectedItems.length > 0 && <span>{selectedItems.length} selected</span>}
        </div>

        {/* Items List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredItems.map((item: any) => (
            <div
              key={item.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedItems.includes(item.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleItemToggle(item.id)}
            >
              <div className="flex items-start gap-3">
                { item.image && (
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex items-center gap-2">
                      {item.price && <Badge variant="outline">{item.price}</Badge>}
                      {selectedItems.includes(item.id) && <CheckCircle className="h-4 w-4 text-blue-500" />}
                    </div>
                  </div>
                  {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                  {item.category && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {item.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Input */}
        {data.allow_additional_input && (
          <div>
            <label className="block text-sm font-medium mb-2">Additional Instructions (Optional)</label>
            <Input
              value={additionalInput}
              onChange={(e) => setAdditionalInput(e.target.value)}
              placeholder="Add any additional context..."
            />
          </div>
        )}

        <Button onClick={handleSubmit} disabled={selectedItems.length === 0} className="w-full">
          Select {selectedItems.length} Item{selectedItems.length !== 1 ? "s" : ""}
        </Button>
      </CardContent>
    </Card>
  )
}

export function HierarchicalSelectionHandler({ data, onResponse }: AdvancedInteractionProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(data.expand_all ? new Set() : new Set(["root"]))
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const handleItemSelect = (nodeId: string) => {
    if (data.multiple) {
      setSelectedItems((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]))
    } else {
      setSelectedItems([nodeId])
    }
  }

  const renderNode = (node: any, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedItems.includes(node.id)

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
            isSelected ? "bg-blue-50 border border-blue-200" : ""
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleNode(node.id)} className="p-1">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <Checkbox checked={isSelected} onCheckedChange={() => handleItemSelect(node.id)} />

          <span className="flex-1">{node.name}</span>

          {data.show_counts && node.count && (
            <Badge variant="outline" className="text-xs">
              {node.count}
            </Badge>
          )}
        </div>

        {hasChildren && isExpanded && <div>{node.children.map((child: any) => renderNode(child, level + 1))}</div>}
      </div>
    )
  }

  const handleSubmit = () => {
    onResponse({
      type: "hierarchical_selection_response",
      selected_items: selectedItems,
      message: `Selected ${selectedItems.length} items`,
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-green-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto border rounded-lg p-2">{renderNode(data.tree_data)}</div>

        <Button onClick={handleSubmit} disabled={selectedItems.length === 0} className="w-full">
          Select {selectedItems.length} Item{selectedItems.length !== 1 ? "s" : ""}
        </Button>
      </CardContent>
    </Card>
  )
}

export function AutocompleteSelectionHandler({ data, onResponse }: AdvancedInteractionProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSearch = (term: string) => {
    setSearchTerm(term)

    if (term.length >= data.min_chars) {
      const filtered = data.static_options.filter(
        (option: any) =>
          option.name.toLowerCase().includes(term.toLowerCase()) ||
          (option.email && option.email.toLowerCase().includes(term.toLowerCase())),
      )
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (item: any) => {
    if (data.multiple) {
      if (!selectedItems.find((selected) => selected.id === item.id)) {
        setSelectedItems((prev) => [...prev, item])
      }
    } else {
      setSelectedItems([item])
    }
    setSearchTerm("")
    setShowSuggestions(false)
  }

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const handleSubmit = () => {
    onResponse({
      type: "autocomplete_selection_response",
      selected_items: selectedItems,
      search_term: searchTerm,
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Input
            placeholder={data.placeholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm.length >= data.min_chars && setShowSuggestions(true)}
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className="font-medium">{suggestion.name}</div>
                  {suggestion.email && <div className="text-sm text-gray-600">{suggestion.email}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Selected:</label>
            <div className="flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <Badge key={item.id} variant="secondary" className="flex items-center gap-1">
                  {item.name}
                  <button onClick={() => handleRemoveItem(item.id)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={selectedItems.length === 0} className="w-full">
          Confirm Selection
        </Button>
      </CardContent>
    </Card>
  )
}

export function ComparisonViewHandler({ data, onResponse }: AdvancedInteractionProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const handleSubmit = () => {
    onResponse({
      type: "comparison_response",
      selected_item: selectedItem,
      message: selectedItem
        ? `Selected ${data.items.find((item: any) => item.id === selectedItem)?.name}`
        : "No selection made",
    })
  }

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Compare className="h-5 w-5 text-orange-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b font-medium">Feature</th>
                {data.items.map((item: any) => (
                  <th key={item.id} className="text-center p-3 border-b">
                    <div className="space-y-2">
                      <div className="font-medium">{item.name}</div>
                      {data.allow_selection && (
                        <Button
                          size="sm"
                          variant={selectedItem === item.id ? "default" : "outline"}
                          onClick={() => setSelectedItem(item.id)}
                        >
                          {selectedItem === item.id ? "Selected" : "Select"}
                        </Button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.comparison_fields.map((field: string) => (
                <tr key={field}>
                  <td className="p-3 border-b font-medium capitalize">{field.replace("_", " ")}</td>
                  {data.items.map((item: any) => (
                    <td key={item.id} className="p-3 border-b text-center">
                      <span className={data.highlight_differences ? "font-medium" : ""}>{item[field] || "—"}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.allow_selection && (
          <Button onClick={handleSubmit} disabled={!selectedItem} className="w-full">
            Confirm Selection
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function BulkActionSelectorHandler({ data, onResponse }: AdvancedInteractionProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedAction, setSelectedAction] = useState<string>("")
  const [filters, setFilters] = useState<Record<string, any>>({})

  const filteredItems = useMemo(() => {
    return data.items.filter((item: any) => {
      return Object.entries(filters).every(([field, value]) => {
        if (!value) return true
        return item[field] === value
      })
    })
  }, [data.items, filters])

  const handleSelectAll = () => {
    setSelectedItems(filteredItems.map((item: any) => item.id))
  }

  const handleClearAll = () => {
    setSelectedItems([])
  }

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const handleSubmit = () => {
    onResponse({
      type: "bulk_action_response",
      selected_items: selectedItems,
      action: selectedAction,
      filters: filters,
      message: `Applied ${selectedAction} to ${selectedItems.length} items`,
    })
  }

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        {data.filters.length > 0 && (
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <Filter className="h-5 w-5 text-gray-500 mt-1" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.filters.map((filter: any) => (
                <div key={filter.field}>
                  <label className="block text-sm font-medium mb-1 capitalize">{filter.field.replace("_", " ")}</label>
                  <select
                    value={filters[filter.field] || ""}
                    onChange={(e) => setFilters((prev) => ({ ...prev, [filter.field]: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">All</option>
                    {filter.options.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.actions.map((action: any) => (
            <div
              key={action.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAction === action.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedAction(action.id)}
            >
              <h4 className="font-medium">{action.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{action.description}</p>
            </div>
          ))}
        </div>

        {/* Item Selection */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">
              Select Items ({selectedItems.length}/{filteredItems.length})
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {filteredItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50">
                <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={() => handleItemToggle(item.id)} />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {Object.entries(item)
                      .slice(1, 3)
                      .map(([key, value]) => (
                        <span key={key} className="mr-4">
                          {key}: {value}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={selectedItems.length === 0 || !selectedAction} className="w-full">
          Apply {selectedAction} to {selectedItems.length} Items
        </Button>
      </CardContent>
    </Card>
  )
}
