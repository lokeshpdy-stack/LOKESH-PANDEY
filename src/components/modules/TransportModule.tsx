import React, { useState } from 'react';
import {
  Bus,
  Phone,
  MapPin,
  Plus,
  ChevronRight,
  ChevronLeft,
  X,
  UserCheck,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { BusRoute, BusStop, TripStatus } from '../../types/school';
import { formatINR } from '../../utils/formatters';

const TRIP_STATUSES: TripStatus[] = [
  'Not Started',
  'On Route - Pickup',
  'Reached School',
  'On Route - Drop',
];

export function TransportModule() {
  const {
    db,
    currentUser,
    addBusRoute,
    updateBusRoute,
    deleteBusRoute,
    updateTripProgress,
    assignStudentBus,
  } = useSchool();

  const isAdmin = currentUser?.role === 'admin';
  const [selectedRouteId, setSelectedRouteId] = useState<string>(db.busRoutes[0]?.id || '');
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  const [routeForm, setRouteForm] = useState({
    routeCode: `RT-0${db.busRoutes.length + 1}`,
    routeName: '',
    vehicleNumber: 'RJ-10-PB-',
    capacity: 36,
    driverName: '',
    driverContact: '+91 ',
    conductorName: '',
    monthlyFee: 1200,
    stopsText:
      'Main Stand Rajaldesar | 07:20 AM | 02:20 PM | Bus Stand\nWard No 14 Dangiya Bass | 07:40 AM | 02:40 PM | School Gate',
  });

  // Student / Parent View
  if (currentUser?.role === 'student') {
    const student = db.students.find((s) => s.id === currentUser.studentId) || db.students[0];
    const myRoute = student ? db.busRoutes.find((r) => r.id === student.busRouteId) : undefined;
    const myStop = myRoute?.stops.find((st) => st.id === student?.busStopId);

    return (
      <div className="space-y-6">
        {!myRoute ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <Bus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-slate-900">No Bus Route Assigned</h2>
            <p className="text-xs text-slate-500 mt-1">
              {student?.name || 'Student'} is currently marked as Self / Private Transport.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono-num text-blue-800 font-semibold">
                  {myRoute.routeCode} · Vehicle {myRoute.vehicleNumber}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{myRoute.routeName}</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Driver: <strong>{myRoute.driverName}</strong> · Helper: {myRoute.conductorName} ·
                  Monthly Bus Fee:{' '}
                  <span className="font-mono-num">{formatINR(myRoute.monthlyFee)}</span>
                </p>
              </div>
              <div className="flex flex-col sm:items-end gap-1.5">
                <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
                  Status: {myRoute.tripStatus}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono-num text-slate-800 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-blue-700" />
                  <span>Driver Contact: {myRoute.driverContact}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Last Updated: <span className="font-mono-num">{myRoute.lastUpdated}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Live Route Stop Progress (Your Stop: {myStop?.name})
              </h3>
              <div className="space-y-2.5">
                {myRoute.stops.map((stop, idx) => {
                  const isCurrent = idx === myRoute.currentStopIndex;
                  const isMine = stop.id === myStop?.id;
                  const passed = idx < myRoute.currentStopIndex;
                  return (
                    <div
                      key={stop.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-400'
                          : isMine
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono-num shrink-0 ${
                            isCurrent
                              ? 'bg-blue-800 text-white'
                              : passed
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {passed ? '✓' : idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {stop.name}{' '}
                            {isCurrent && (
                              <span className="text-xs font-bold text-blue-800">
                                — Bus Currently Here
                              </span>
                            )}
                            {isMine && !isCurrent && (
                              <span className="text-xs font-bold text-amber-800">
                                — Your Assigned Stop
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{stop.landmark}</div>
                        </div>
                      </div>
                      <div className="text-xs font-mono-num text-slate-700 sm:text-right">
                        <div>Pickup: {stop.pickupTime}</div>
                        <div>Drop: {stop.dropTime}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin Transport Console
  const activeRoute = db.busRoutes.find((r) => r.id === selectedRouteId) || db.busRoutes[0];
  const assignedStudents = activeRoute
    ? db.students.filter((s) => s.busRouteId === activeRoute.id)
    : [];
  const unassignedStudents = db.students.filter((s) => !s.busRouteId);

  const openAddModal = () => {
    setEditingRouteId(null);
    setRouteForm({
      routeCode: `RT-0${db.busRoutes.length + 1}`,
      routeName: '',
      vehicleNumber: 'RJ-10-PB-',
      capacity: 36,
      driverName: '',
      driverContact: '+91 ',
      conductorName: '',
      monthlyFee: 1200,
      stopsText:
        'Main Stand | 07:20 AM | 02:20 PM | Main Market\nSchool Gate | 07:50 AM | 02:45 PM | Ward No. 14',
    });
    setRouteModalOpen(true);
  };

  const openEditModal = (route: BusRoute) => {
    setEditingRouteId(route.id);
    setRouteForm({
      routeCode: route.routeCode,
      routeName: route.routeName,
      vehicleNumber: route.vehicleNumber,
      capacity: route.capacity,
      driverName: route.driverName,
      driverContact: route.driverContact,
      conductorName: route.conductorName,
      monthlyFee: route.monthlyFee,
      stopsText: route.stops
        .map((st) => `${st.name} | ${st.pickupTime} | ${st.dropTime} | ${st.landmark}`)
        .join('\n'),
    });
    setRouteModalOpen(true);
  };

  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    const existingRoute = editingRouteId
      ? db.busRoutes.find((r) => r.id === editingRouteId)
      : undefined;

    const parsedStops: BusStop[] = routeForm.stopsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const [name, pickupTime, dropTime, landmark] = line.split('|').map((s) => s.trim());
        const existingStopId = existingRoute?.stops[idx]?.id;
        return {
          id: existingStopId || `stop-${Date.now()}-${idx}`,
          name: name || `Stop ${idx + 1}`,
          pickupTime: pickupTime || '07:30 AM',
          dropTime: dropTime || '02:30 PM',
          landmark: landmark || 'Main Road',
        };
      });

    if (editingRouteId && existingRoute) {
      updateBusRoute({
        ...existingRoute,
        routeCode: routeForm.routeCode,
        routeName: routeForm.routeName,
        vehicleNumber: routeForm.vehicleNumber,
        capacity: Number(routeForm.capacity) || 36,
        driverName: routeForm.driverName,
        driverContact: routeForm.driverContact,
        conductorName: routeForm.conductorName,
        monthlyFee: Number(routeForm.monthlyFee) || 0,
        stops: parsedStops,
        currentStopIndex: Math.min(existingRoute.currentStopIndex, Math.max(0, parsedStops.length - 1)),
      });
    } else {
      addBusRoute({
        routeCode: routeForm.routeCode,
        routeName: routeForm.routeName,
        vehicleNumber: routeForm.vehicleNumber,
        capacity: Number(routeForm.capacity) || 36,
        driverName: routeForm.driverName,
        driverContact: routeForm.driverContact,
        conductorName: routeForm.conductorName,
        monthlyFee: Number(routeForm.monthlyFee) || 0,
        stops: parsedStops,
        tripStatus: 'Not Started',
        currentStopIndex: 0,
        lastUpdated: 'Just now',
      });
    }
    setRouteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Fleet Routes, Live Trip Control &amp; Student Allocation
          </h2>
          <p className="text-xs text-slate-500">
            Add, edit, or delete bus routes and update live stop progress.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bus Route</span>
          </button>
        )}
      </div>

      {db.busRoutes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <p className="text-sm text-slate-600">No bus routes configured yet.</p>
          {isAdmin && (
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-800 text-white text-xs font-semibold rounded-lg"
            >
              Create First Bus Route
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {db.busRoutes.map((route) => {
              const isSelected = activeRoute?.id === route.id;
              const count = db.students.filter((s) => s.busRouteId === route.id).length;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedRouteId(route.id);
                  }}
                  className={`cursor-pointer text-left p-4 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono-num font-bold text-blue-800">{route.routeCode}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono-num text-slate-600 mr-1">
                        {route.vehicleNumber}
                      </span>
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(route);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-white"
                            title="Edit Bus Route"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBusRoute(route.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-700 rounded hover:bg-red-50"
                            title="Delete Bus Route"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{route.routeName}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Driver: {route.driverName} · {formatINR(route.monthlyFee)}/mo
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{route.tripStatus}</span>
                    <span className="font-mono-num text-slate-500">
                      {count}/{route.capacity} seats
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {activeRoute && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Live Trip Control */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Live Trip Tracker — {activeRoute.routeCode}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Driver: {activeRoute.driverName} ({activeRoute.driverContact}) · Conductor:{' '}
                      {activeRoute.conductorName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-num text-slate-500">
                      Updated: {activeRoute.lastUpdated}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => openEditModal(activeRoute)}
                        className="px-2.5 py-1 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit Route
                      </button>
                    )}
                  </div>
                </div>

                {/* Trip Status Controls */}
                <div className="flex flex-wrap gap-1.5">
                  {TRIP_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() =>
                        updateTripProgress(activeRoute.id, st, activeRoute.currentStopIndex)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        activeRoute.tripStatus === st
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Stop Stepper */}
                <div className="space-y-2">
                  {activeRoute.stops.map((stop, idx) => {
                    const isCurrent = idx === activeRoute.currentStopIndex;
                    const passed = idx < activeRoute.currentStopIndex;
                    return (
                      <button
                        key={stop.id}
                        type="button"
                        onClick={() =>
                          updateTripProgress(activeRoute.id, activeRoute.tripStatus, idx)
                        }
                        className={`w-full text-left p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                          isCurrent
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono-num shrink-0 ${
                              isCurrent
                                ? 'bg-blue-800 text-white'
                                : passed
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {passed ? '✓' : idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">
                              {stop.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {stop.landmark}
                            </div>
                          </div>
                        </div>
                        <div className="text-[11px] font-mono-num text-slate-600 shrink-0 text-right">
                          <div>Pick: {stop.pickupTime}</div>
                          <div>Drop: {stop.dropTime}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={activeRoute.currentStopIndex <= 0}
                    onClick={() =>
                      updateTripProgress(
                        activeRoute.id,
                        activeRoute.tripStatus,
                        activeRoute.currentStopIndex - 1
                      )
                    }
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous Stop</span>
                  </button>
                  <button
                    type="button"
                    disabled={activeRoute.currentStopIndex >= activeRoute.stops.length - 1}
                    onClick={() =>
                      updateTripProgress(
                        activeRoute.id,
                        activeRoute.tripStatus === 'Not Started'
                          ? 'On Route - Pickup'
                          : activeRoute.tripStatus,
                        activeRoute.currentStopIndex + 1
                      )
                    }
                    className="px-3.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                  >
                    <span>Advance to Next Stop</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Student Allocation Panel */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Assigned Students ({assignedStudents.length})
                  </h3>
                  <span className="text-xs font-mono-num text-slate-500">
                    Fee: {formatINR(activeRoute.monthlyFee)}/mo
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {assignedStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No students assigned to this route yet.
                    </p>
                  ) : (
                    assignedStudents.map((stu) => {
                      const stop = activeRoute.stops.find((st) => st.id === stu.busStopId);
                      return (
                        <div
                          key={stu.id}
                          className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {stu.name} ({stu.className})
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{stop?.name || 'Stop'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => assignStudentBus(stu.id, null, null)}
                            className="px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {unassignedStudents.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                      <span>Quick Assign Student to {activeRoute.routeCode}</span>
                    </div>
                    <AssignStudentBusForm
                      students={unassignedStudents}
                      route={activeRoute}
                      onAssign={(studentId, stopId) =>
                        assignStudentBus(studentId, activeRoute.id, stopId)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Bus Route Modal */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingRouteId ? 'Edit School Bus Route' : 'Add School Bus Route'}
              </h3>
              <button
                type="button"
                onClick={() => setRouteModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRoute} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Route Code *</label>
                  <input
                    required
                    value={routeForm.routeCode}
                    onChange={(e) => setRouteForm({ ...routeForm, routeCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle No *</label>
                  <input
                    required
                    value={routeForm.vehicleNumber}
                    onChange={(e) => setRouteForm({ ...routeForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Route Name *</label>
                <input
                  required
                  value={routeForm.routeName}
                  onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                  placeholder="e.g., Rajaldesar Town - Ward 14 Loop"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Name *</label>
                  <input
                    required
                    value={routeForm.driverName}
                    onChange={(e) => setRouteForm({ ...routeForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Contact *</label>
                  <input
                    required
                    value={routeForm.driverContact}
                    onChange={(e) => setRouteForm({ ...routeForm, driverContact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Conductor</label>
                  <input
                    value={routeForm.conductorName}
                    onChange={(e) => setRouteForm({ ...routeForm, conductorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    value={routeForm.capacity}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, capacity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={routeForm.monthlyFee}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, monthlyFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Stops (One per line: Name | Pickup | Drop | Landmark)
                </label>
                <textarea
                  rows={4}
                  value={routeForm.stopsText}
                  onChange={(e) => setRouteForm({ ...routeForm, stopsText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg font-semibold"
                >
                  {editingRouteId ? 'Save Route Changes' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignStudentBusForm({
  students,
  route,
  onAssign,
}: {
  students: { id: string; name: string; className: string }[];
  route: BusRoute;
  onAssign: (studentId: string, stopId: string) => void;
}) {
  const [stuId, setStuId] = useState(students[0]?.id || '');
  const [stopId, setStopId] = useState(route.stops[0]?.id || '');

  return (
    <div className="space-y-2">
      <select
        value={stuId}
        onChange={(e) => setStuId(e.target.value)}
        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
      >
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.className})
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select
          value={stopId}
          onChange={(e) => setStopId(e.target.value)}
          className="flex-1 px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
        >
          {route.stops.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => stuId && stopId && onAssign(stuId, stopId)}
          className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
        >
          Assign
        </button>
      </div>
    </div>
  );
}
