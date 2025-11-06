"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/database/supabase/client";
import { RoleGuard } from "@/components/features/auth";
import { DashboardLayout } from "@/components/shared";
import { adminMenuItems } from "@/components/features/admin/adminMenuItems";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Input,
} from "@heroui/react";
import {
  ExclamationTriangleIcon,
  UserIcon,
  ComputerDesktopIcon,
  ServerIcon,
  CircleStackIcon,
  GlobeAltIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";

interface ErrorEvent {
  id: string;
  error_message: string;
  error_type: string | null;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  source: "client" | "server" | "api" | "database" | "third_party" | "unknown";
  component_name: string | null;
  page_url: string | null;
  user_id: string | null;
  created_at: string;
  tags: Record<string, unknown>;
  extra_data: Record<string, unknown>;
}

interface ErrorStats {
  total: number;
  bySeverity: {
    critical: number;
    error: number;
    warning: number;
    info: number;
    debug: number;
  };
  bySource: {
    client: number;
    server: number;
    api: number;
    database: number;
    third_party: number;
    unknown: number;
  };
  uniqueUsers: number;
  uniqueSessions: number;
}

function ErrorTrackingContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [filters, setFilters] = useState({
    severity: "",
    source: "",
    errorType: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  useEffect(() => {
    if (user) {
      loadErrorData();
    }
  }, [user, filters]);

  const loadErrorData = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.append("severity", filters.severity);
      if (filters.source) params.append("source", filters.source);
      if (filters.errorType) params.append("errorType", filters.errorType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(
        `/api/admin/error-tracking?${params.toString()}`
      );
      const result = await response.json();

      if (result.success) {
        setErrors(result.data.errors);
        setStats(result.data.stats);
      } else {
        toast.error(result.error || "Failed to load error data");
      }
    } catch (error) {
      console.error("Error loading error data:", error);
      toast.error("Failed to load error data");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "danger";
      case "error":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "primary";
      case "debug":
        return "default";
      default:
        return "default";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "client":
        return ComputerDesktopIcon;
      case "server":
        return ServerIcon;
      case "api":
        return GlobeAltIcon;
      case "database":
        return CircleStackIcon;
      default:
        return QuestionMarkCircleIcon;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="Error Tracking"
        headerSubtitle="Monitor and analyze application errors"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-400">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={adminMenuItems}
      headerTitle="Error Tracking"
      headerSubtitle="Monitor and analyze application errors"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Errors</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Critical Errors</p>
                    <p className="text-2xl font-bold text-red-500">
                      {stats.bySeverity.critical}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Affected Users</p>
                    <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                  </div>
                  <UserIcon className="w-8 h-8 text-blue-500" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Affected Sessions</p>
                    <p className="text-2xl font-bold">{stats.uniqueSessions}</p>
                  </div>
                  <ComputerDesktopIcon className="w-8 h-8 text-green-500" />
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Filters</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Select
                label="Severity"
                placeholder="All severities"
                selectedKeys={filters.severity ? [filters.severity] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setFilters({ ...filters, severity: value || "" });
                }}
              >
                <SelectItem key="critical">Critical</SelectItem>
                <SelectItem key="error">Error</SelectItem>
                <SelectItem key="warning">Warning</SelectItem>
                <SelectItem key="info">Info</SelectItem>
                <SelectItem key="debug">Debug</SelectItem>
              </Select>

              <Select
                label="Source"
                placeholder="All sources"
                selectedKeys={filters.source ? [filters.source] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setFilters({ ...filters, source: value || "" });
                }}
              >
                <SelectItem key="client">Client</SelectItem>
                <SelectItem key="server">Server</SelectItem>
                <SelectItem key="api">API</SelectItem>
                <SelectItem key="database">Database</SelectItem>
                <SelectItem key="third_party">Third Party</SelectItem>
              </Select>

              <Input
                type="date"
                label="Start Date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />

              <Input
                type="date"
                label="End Date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />

              <Button
                color="default"
                variant="flat"
                onPress={() =>
                  setFilters({
                    severity: "",
                    source: "",
                    errorType: "",
                    startDate: "",
                    endDate: "",
                  })
                }
              >
                Clear Filters
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Error List */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Errors</h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Error events table">
              <TableHeader>
                <TableColumn>SEVERITY</TableColumn>
                <TableColumn>SOURCE</TableColumn>
                <TableColumn>ERROR MESSAGE</TableColumn>
                <TableColumn>COMPONENT</TableColumn>
                <TableColumn>PAGE</TableColumn>
                <TableColumn>TIME</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No errors found">
                {errors.map((error) => {
                  const SourceIcon = getSourceIcon(error.source);
                  return (
                    <TableRow key={error.id}>
                      <TableCell>
                        <Chip
                          color={getSeverityColor(error.severity) as any}
                          size="sm"
                          variant="flat"
                        >
                          {error.severity.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <SourceIcon className="w-4 h-4" />
                          <span className="capitalize">{error.source}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm font-medium truncate">
                            {error.error_message}
                          </p>
                          {error.error_type && (
                            <p className="text-xs text-gray-400">
                              {error.error_type}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {error.component_name ? (
                          <Chip size="sm" variant="flat">
                            {error.component_name}
                          </Chip>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {error.page_url ? (
                          <span className="text-sm text-gray-400 truncate max-w-xs block">
                            {error.page_url}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-400">
                          {new Date(error.created_at).toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function ErrorTrackingPage() {
  return (
    <RoleGuard allowedRole="admin">
      <ErrorTrackingContent />
    </RoleGuard>
  );
}
