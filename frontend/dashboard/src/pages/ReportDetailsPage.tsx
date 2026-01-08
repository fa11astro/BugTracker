import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Alert, Box, Button, CircularProgress, Paper, Stack, Typography,} from '@mui/material';
import {ImageNotSupported, ZoomIn} from '@mui/icons-material';
import {api} from '../api/Api';
import {CriticalityLevel, Event, Report, ReportStatus, Session} from '../types/types';
import {useAuth} from '../contexts/AuthContext';
import ReportHeader from '../components/report/ReportHeader';
import ReportDetailsCard from '../components/report/ReportDetailsCard';
import SessionDetailsCard from '../components/report/SessionDetailsCard';
import EventsTable from '../components/report/EventsTable';

const ReportDetailsPage: React.FC = () => {
    const { reportId } = useParams<{ reportId: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [report, setReport] = useState<Report | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
    const [fullscreenScreenshot, setFullscreenScreenshot] = useState(false);
    const [editData, setEditData] = useState({
        status: ReportStatus.NEW,
        level: CriticalityLevel.UNKNOWN,
        comments: '',
        projectId: '',
        developerName: '',
    });

    useEffect(() => {
        if (reportId) {
            fetchData();
        }

        return () => {
            if (screenshotUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(screenshotUrl);
            }
        };
    }, [reportId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const reportData = await api.getReport(parseInt(reportId!));

            const processedReport = {
                ...reportData,
                level: reportData.level || CriticalityLevel.UNKNOWN,
                developerName: reportData.developerName || (reportData as any)?.developerName || null,
                status: reportData.status || ReportStatus.NEW,
                comments: reportData.comments || '',
                userEmail: reportData.userEmail || (reportData as any)?.userEmail || null,
                userProvided: Boolean(reportData.userProvided || (reportData as any)?.userProvided || false),
                sessionId: reportData.sessionId || (reportData as any)?.sessionId || null,
                currentUrl: reportData.currentUrl || (reportData as any)?.currentUrl || '',
                screenUrl: reportData.screenUrl || (reportData as any)?.screenUrl || null,
                tags: reportData.tags || (reportData as any)?.tags || [],
            };

            console.log('📊 Report data:', processedReport);
            console.log('📸 Screenshot URL:', processedReport.screenUrl);

            setReport(processedReport as Report);

            if (processedReport.screenUrl || processedReport.id) {
                try {
                    const token = localStorage.getItem('token');
                    const screenshotEndpoint = processedReport.screenUrl?.startsWith('/')
                        ? `http://localhost:8080${processedReport.screenUrl}`
                        : `http://localhost:8080/api/reports/${processedReport.id}/screenshot`;

                    const response = await fetch(screenshotEndpoint, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        setScreenshotUrl(blobUrl);
                    }
                } catch (err) {
                    console.error('Failed to load screenshot:', err);
                }
            }

            setEditData({
                status: processedReport.status,
                level: processedReport.level,
                comments: processedReport.comments,
                projectId: processedReport.projectId || '',
                developerName: processedReport.developerName || '',
            });

            if (processedReport.sessionId) {
                try {
                    const sessionData = await api.getSession(processedReport.sessionId.toString());

                    const sessionPlugins = (sessionData as any).plugins;
                    let plugins: string[] = [];

                    if (sessionPlugins) {
                        plugins = sessionPlugins.filter((p: any) => typeof p === 'string' && p.trim() !== '');
                    }

                    const processedSession = {
                        ...sessionData,
                        plugins: plugins
                    };

                    setSession(processedSession as Session);

                    const eventsData = await api.getSessionEvents(processedReport.sessionId.toString());

                    const processedEvents = eventsData.map((event: any) => ({
                        ...event,
                        eventId: event.eventId || event.id,
                        fileName: event.fileName || event.metadata?.fileName || '',
                        lineNumber: event.lineNumber || event.metadata?.lineNumber || '',
                        statusCode: event.statusCode || event.metadata?.statusCode || '',
                        element: event.element || event.metadata?.element || '',
                        log: event.log || '',
                        stackTrace: event.stackTrace || '',
                        metadata: event.metadata || null
                    }));

                    setEvents(processedEvents);
                } catch (err) {
                    console.warn('Failed to load session/events:', err);
                    setEvents([]);
                }
            } else {
                setEvents([]);
            }
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load report details');
        } finally {
            setLoading(false);
        }
    };

    const getCriticalityColor = (criticality: CriticalityLevel) => {
        switch(criticality) {
            case CriticalityLevel.CRITICAL: return 'error';
            case CriticalityLevel.HIGH: return 'error';
            case CriticalityLevel.MEDIUM: return 'warning';
            case CriticalityLevel.LOW: return 'info';
            default: return 'default';
        }
    };

    const getCriticalityLabel = (level: CriticalityLevel) => {
        switch(level) {
            case CriticalityLevel.CRITICAL: return 'Critical';
            case CriticalityLevel.HIGH: return 'High';
            case CriticalityLevel.MEDIUM: return 'Medium';
            case CriticalityLevel.LOW: return 'Low';
            default: return String(level);
        }
    };

    const getStatusColor = (status: ReportStatus) => {
        switch(status) {
            case ReportStatus.NEW: return 'error';
            case ReportStatus.IN_PROGRESS: return 'warning';
            case ReportStatus.DONE: return 'success';
            default: return 'default';
        }
    };

    const handleSave = async () => {
        if (!report) return;

        try {
            const updatedReport = await api.updateReportDashboard(report.id, {
                status: editData.status,
                level: editData.level,
                comments: editData.comments,
                projectId: editData.projectId || undefined,
                developerName: editData.developerName || undefined,
            });

            const processedReport = {
                ...updatedReport,
                level: updatedReport.level,
            };

            setReport(processedReport as Report);
            setEditing(false);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to update report');
        }
    };

    const handleCancel = () => {
        if (!report) return;
        setEditData({
            status: report.status || ReportStatus.NEW,
            level: report.level || CriticalityLevel.UNKNOWN,
            comments: report.comments || '',
            projectId: report.projectId || '',
            developerName: report.developerName || '',
        });
        setEditing(false);
    };

    const handleEditDataChange = (field: keyof typeof editData, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!report) {
        return (
            <Box>
                <Alert severity="error">
                    Report not found
                </Alert>
                <Box
                    onClick={() => navigate(-1)}
                    sx={{ mt: 2 }}
                >
                    Go Back
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <ReportHeader
                report={report}
                editing={editing}
                onBack={() => navigate(-1)}
                onEdit={() => setEditing(true)}
                onSave={handleSave}
                onCancel={handleCancel}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Stack spacing={3}>
                {/* Screenshot Section */}
                {screenshotUrl && (
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Screenshot
                            </Typography>
                            <Box>
                                <Button
                                    startIcon={<ZoomIn />}
                                    onClick={() => setFullscreenScreenshot(!fullscreenScreenshot)}
                                    size="small"
                                    sx={{ mr: 1 }}
                                >
                                    {fullscreenScreenshot ? 'Normal View' : 'Zoom In'}
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper'
                        }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    bgcolor: '#f5f5f5',
                                    minHeight: fullscreenScreenshot ? '70vh' : 400,
                                    maxHeight: fullscreenScreenshot ? '70vh' : 400,
                                    overflow: 'auto',
                                    p: fullscreenScreenshot ? 2 : 0
                                }}
                            >
                                <img
                                    src={screenshotUrl}
                                    alt="Report Screenshot"
                                    style={{
                                        maxWidth: fullscreenScreenshot ? '100%' : 'auto',
                                        maxHeight: fullscreenScreenshot ? '100%' : 400,
                                        objectFit: fullscreenScreenshot ? 'contain' : 'scale-down',
                                        display: 'block'
                                    }}
                                    onError={(e) => {
                                        console.error('Failed to load screenshot:', e);
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                            </Box>

                            {!screenshotUrl && (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: 400,
                                    color: 'text.secondary'
                                }}>
                                    <ImageNotSupported sx={{ fontSize: 60, mb: 2 }} />
                                    <Typography variant="body1">
                                        No screenshot available
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {report.currentUrl && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                URL: {report.currentUrl}
                            </Typography>
                        )}
                    </Paper>
                )}

                {/* Report Details */}
                <ReportDetailsCard
                    report={report}
                    editing={editing}
                    editData={editData}
                    onEditDataChange={handleEditDataChange}
                    getCriticalityLabel={getCriticalityLabel}
                    getCriticalityColor={getCriticalityColor}
                    getStatusColor={getStatusColor}
                />

                {/* Session Details */}
                {report.sessionId && session && (
                    <SessionDetailsCard
                        session={session}
                        getDeviceIcon={(deviceType?: string) => {
                            if (!deviceType) return 'DesktopWindows';
                            const typeUpper = deviceType.toUpperCase();
                            if (typeUpper.includes('MOBILE') || typeUpper.includes('PHONE')) return 'Smartphone';
                            if (typeUpper.includes('TABLET')) return 'Tablet';
                            return 'DesktopWindows';
                        }}
                    />
                )}

                {/* Events List */}
                <EventsTable events={events} />
            </Stack>

            {/* Fullscreen Modal for Screenshot */}
            {fullscreenScreenshot && screenshotUrl && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 1300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2
                    }}
                    onClick={() => setFullscreenScreenshot(false)}
                >
                    <Box
                        sx={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={screenshotUrl}
                            alt="Fullscreen Screenshot"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: 8
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={() => setFullscreenScreenshot(false)}
                            sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                bgcolor: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                                }
                            }}
                        >
                            Close
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default ReportDetailsPage;