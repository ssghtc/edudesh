import React, { useState } from 'react';
import {
    Question, Subject, QuestionType, ClientNeedsCategory,
    DiagramElement, ClozeElement, MatrixColumn, MatrixRow, OrderingItem,
    DropdownGroup, DragDropItem, DropZone, ClassificationCondition, ClassificationCharacteristic,
    ExpectedFinding, IndicatedIntervention, SataOption, PriorityActionOption, CaseStudySubQuestion, Exhibit
} from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { getClientNeedsLabel } from '@/utils/clientNeeds';

interface QuestionManagerProps {
    questions: Question[];
    setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
    subjects: Subject[];
    onRefresh?: () => Promise<void>;
}

export default function QuestionManager({ questions, setQuestions, subjects, onRefresh }: QuestionManagerProps) {
    const [questionType, setQuestionType] = useState<QuestionType>('single');
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctOptions, setCorrectOptions] = useState<number[]>([0]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedChapter, setSelectedChapter] = useState('');
    const [customId, setCustomId] = useState('');
    const [exhibits, setExhibits] = useState<Exhibit[]>([]);
    // Deprecated: existingContent for backward compatibility
    const [exhibitContent, setExhibitContent] = useState('');

    // Diagram-specific fields
    const [diagramType, setDiagramType] = useState<'flowchart' | 'labeled-diagram' | 'process-flow'>('flowchart');
    const [diagramElements, setDiagramElements] = useState<DiagramElement[]>([
        {
            id: 'step1',
            label: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            position: { x: 50, y: 20 }
        }
    ]);

    // Cloze-specific fields
    const [clozeText, setClozeText] = useState('');
    const [clozeElements, setClozeElements] = useState<ClozeElement[]>([]);

    // Matrix-specific fields
    const [matrixColumns, setMatrixColumns] = useState<MatrixColumn[]>([
        { id: 'col1', label: 'Anticipated' },
        { id: 'col2', label: 'Not Anticipated' }
    ]);
    const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([
        { id: 'row1', text: '', correctColumnId: '' }
    ]);

    // Ordering-specific fields
    const [orderingItems, setOrderingItems] = useState<OrderingItem[]>([
        { id: 'item1', text: '' },
        { id: 'item2', text: '' },
        { id: 'item3', text: '' }
    ]);

    // Input-specific fields
    const [correctAnswerInput, setCorrectAnswerInput] = useState('');
    const [answerTolerance, setAnswerTolerance] = useState<number>(0);
    const [inputUnit, setInputUnit] = useState('');

    // Clinical Field State
    const [rationale, setRationale] = useState('');
    const [clientNeeds, setClientNeeds] = useState<ClientNeedsCategory | ''>('');
    const [scenario, setScenario] = useState('');

    // 1. Sentence Completion
    const [sentenceTemplate, setSentenceTemplate] = useState('');
    const [dropdownGroups, setDropdownGroups] = useState<DropdownGroup[]>([]);

    // 2. Drag & Drop
    const [dragDropItems, setDragDropItems] = useState<DragDropItem[]>([]);
    const [dragDropZones, setDragDropZones] = useState<DropZone[]>([
        { id: 'priority', label: 'Immediate Follow-up' },
        { id: 'monitor', label: 'Monitor' }
    ]);

    // 3. Compare & Classify
    const [compareConditions, setCompareConditions] = useState<ClassificationCondition[]>([
        { id: 'cond1', name: '' }, { id: 'cond2', name: '' }
    ]);
    const [compareCharacteristics, setCompareCharacteristics] = useState<ClassificationCharacteristic[]>([]);

    // 4. Expected Findings
    const [expectedFindings, setExpectedFindings] = useState<ExpectedFinding[]>([]);
    const [conditionName, setConditionName] = useState('');

    // 5. Indicated Interventions
    const [indicatedInterventions, setIndicatedInterventions] = useState<IndicatedIntervention[]>([]);
    const [clinicalSituation, setClinicalSituation] = useState('');

    // 6. SATA
    const [sataOptions, setSataOptions] = useState<SataOption[]>([]);
    const [sataPrompt, setSataPrompt] = useState('');

    // 7. Priority Action
    const [priorityActions, setPriorityActions] = useState<PriorityActionOption[]>([]);
    const [emergencyScenario, setEmergencyScenario] = useState('');

    // 8. Case Study
    const [casePatientInfo, setCasePatientInfo] = useState('');
    const [caseHistory, setCaseHistory] = useState('');
    const [caseVitals, setCaseVitals] = useState({ bp: '', hr: '', rr: '', temp: '', spo2: '' });
    const [caseLabs, setCaseLabs] = useState('');
    const [caseAssessment, setCaseAssessment] = useState('');
    const [casePrimaryCondition, setCasePrimaryCondition] = useState('');
    const [caseSubQuestions, setCaseSubQuestions] = useState<CaseStudySubQuestion[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [filterSubject, setFilterSubject] = useState('');
    const [filterChapter, setFilterChapter] = useState('');

    // Reset pagination when search query or filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterSubject, filterChapter]);

    const isClinicalType = (type: string) => [
        'sentence_completion', 'drag_drop_priority', 'compare_classify',
        'expected_not_expected', 'indicated_not_indicated', 'sata',
        'priority_action', 'case_study'
    ].includes(type);

    const handleDeleteQuestion = async (id: string, type: string) => {
        if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) return;

        try {
            const isClinical = isClinicalType(type);
            const table = isClinical ? 'clinical_questions' : 'questions';

            const { error } = await supabase.from(table).delete().eq('id', id);

            if (error) throw error;

            setQuestions(questions.filter(q => q.id !== id));
            if (editingQuestionId === id) {
                handleCancelEdit();
            }
        } catch (err: any) {
            console.error('Error deleting question:', err);
            alert('Error deleting question: ' + err.message);
        }
    };

    const handleCancelEdit = () => {
        setEditingQuestionId(null);
        setQuestionText('');
        setCustomId('');
        setOptions(['', '', '', '']);
        setCorrectOptions([0]);
        setExhibits([]);
        setExhibitContent('');
        setRationale('');
        setScenario('');
        setClientNeeds('');

        // Reset specialized fields
        setDiagramElements([{ id: 'step1', label: '', options: ['', '', '', ''], correctAnswer: '', position: { x: 50, y: 20 } }]);
        setClozeText('');
        setClozeElements([]);
        setMatrixRows([{ id: 'row1', text: '', correctColumnId: '' }]);
        setOrderingItems([{ id: 'item1', text: '' }, { id: 'item2', text: '' }, { id: 'item3', text: '' }]);
        setCorrectAnswerInput('');
        setAnswerTolerance(0);
        setInputUnit('');

        // Reset clinical fields
        setSentenceTemplate('');
        setDropdownGroups([]);
        setDragDropItems([]);
        setDragDropZones([{ id: 'priority', label: 'Immediate Follow-up' }, { id: 'monitor', label: 'Monitor' }]);
        setCompareConditions([{ id: 'cond1', name: '' }, { id: 'cond2', name: '' }]);
        setCompareCharacteristics([]);
        setExpectedFindings([]);
        setConditionName('');
        setIndicatedInterventions([]);
        setClinicalSituation('');
        setSataOptions([]);
        setSataPrompt('');
        setPriorityActions([]);
        setEmergencyScenario('');
        setCasePatientInfo('');
        setCaseHistory('');
        setCaseVitals({ bp: '', hr: '', rr: '', temp: '', spo2: '' });
        setCaseLabs('');
        setCaseAssessment('');
        setCasePrimaryCondition('');
        setCaseSubQuestions([]);
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const toggleCorrectOption = (index: number) => {
        if (questionType === 'single') {
            setCorrectOptions([index]);
        } else {
            if (correctOptions.includes(index)) {
                if (correctOptions.length > 1) {
                    setCorrectOptions(correctOptions.filter(i => i !== index));
                }
            } else {
                setCorrectOptions([...correctOptions, index].sort());
            }
        }
    };

    // Diagram element handlers
    const addDiagramElement = () => {
        const newElement: DiagramElement = {
            id: `step${diagramElements.length + 1}`,
            label: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            position: { x: 50, y: 20 + (diagramElements.length * 120) }
        };
        setDiagramElements([...diagramElements, newElement]);
    };

    const removeDiagramElement = (index: number) => {
        if (diagramElements.length > 1) {
            setDiagramElements(diagramElements.filter((_, i) => i !== index));
        }
    };

    const updateDiagramElement = (index: number, field: keyof DiagramElement, value: any) => {
        const newElements = [...diagramElements];
        newElements[index] = { ...newElements[index], [field]: value };
        setDiagramElements(newElements);
    };

    const updateDiagramElementOption = (elementIndex: number, optionIndex: number, value: string) => {
        const newElements = [...diagramElements];
        const newOptions = [...newElements[elementIndex].options];
        newOptions[optionIndex] = value;
        newElements[elementIndex] = { ...newElements[elementIndex], options: newOptions };
        setDiagramElements(newElements);
    };

    // Cloze element handlers
    const addClozeBlank = () => {
        const nextId = (clozeElements.length + 1).toString();
        setClozeText(prev => prev + ` {{${nextId}}} `);
        setClozeElements([...clozeElements, {
            id: nextId,
            options: ['', '', '', ''],
            correctAnswer: ''
        }]);
    };

    const updateClozeElementOption = (elementIndex: number, optionIndex: number, value: string) => {
        const newElements = [...clozeElements];
        const newOptions = [...newElements[elementIndex].options];
        newOptions[optionIndex] = value;
        newElements[elementIndex] = { ...newElements[elementIndex], options: newOptions };
        setClozeElements(newElements);
    };

    const updateClozeElementCorrectAnswer = (elementIndex: number, value: string) => {
        const newElements = [...clozeElements];
        newElements[elementIndex] = { ...newElements[elementIndex], correctAnswer: value };
        setClozeElements(newElements);
    };

    const handleEditQuestion = async (q: Question) => {
        try {
            setEditingQuestionId(q.id);
            setQuestionType(q.type);
            setQuestionText(q.text);
            setSelectedSubject(q.subjectId);
            setSelectedChapter(q.chapterId);
            setRationale(q.rationale || '');
            setScenario(q.scenario || '');
            setClientNeeds(q.clientNeeds || '');
            setExhibitContent(q.exhibitContent || '');
            setCustomId(q.customId || '');
            setExhibits(q.exhibits || (q.exhibitContent ? [{ id: '1', title: 'Exhibit', content: q.exhibitContent }] : []));

            // Standard Types
            if (['single', 'multiple'].includes(q.type)) {
                setOptions(q.options || ['', '', '', '']);
                setCorrectOptions(q.correctOptions || [0]);
            } else if (q.type === 'diagram') {
                setDiagramType(q.diagramType || 'flowchart');
                setDiagramElements(q.diagramElements || []);
            } else if (q.type === 'cloze') {
                setClozeText(q.clozeText || '');
                setClozeElements(q.clozeElements || []);
            } else if (q.type === 'matrix') {
                setMatrixColumns(q.matrixColumns || []);
                setMatrixRows(q.matrixRows || []);
            } else if (q.type === 'ordering') {
                setOrderingItems(q.orderingItems || []);
            } else if (q.type === 'input') {
                setCorrectAnswerInput(q.correctAnswerInput || '');
                setAnswerTolerance(q.answerTolerance || 0);
                setInputUnit(q.inputUnit || '');
            } else if (isClinicalType(q.type)) {
                // Fetch specific clinical data from DB to ensure we have deep nested fields
                // This is needed because the list view might not have all sub-tables joined if not implemented in the fetcher

                // Note: If the passed 'q' object already has the data (e.g. from local creation), we could use it.
                // But fetching is safer for reliability.

                let specificTable = '';
                if (q.type === 'sentence_completion') specificTable = 'sentence_completion_questions';
                else if (q.type === 'drag_drop_priority') specificTable = 'drag_drop_priority_questions';
                else if (q.type === 'compare_classify') specificTable = 'compare_classify_questions';
                else if (q.type === 'expected_not_expected') specificTable = 'expected_finding_questions';
                else if (q.type === 'indicated_not_indicated') specificTable = 'indicated_intervention_questions';
                else if (q.type === 'sata') specificTable = 'sata_questions';
                else if (q.type === 'priority_action') specificTable = 'priority_action_questions';
                else if (q.type === 'case_study') specificTable = 'case_study_questions';

                if (specificTable) {
                    const { data, error } = await supabase
                        .from(specificTable)
                        .select('*')
                        .eq('question_id', q.id)
                        .single();

                    if (!error && data) {
                        if (q.type === 'sentence_completion') {
                            setSentenceTemplate(data.sentence_template);
                            setDropdownGroups(data.dropdown_groups.map((g: any) => ({ ...g, options: g.options || [] })));
                        } else if (q.type === 'drag_drop_priority') {
                            setDragDropItems(data.items || []);
                            setDragDropZones(data.drop_zones || []);
                        } else if (q.type === 'compare_classify') {
                            setCompareConditions(data.conditions || []);
                            setCompareCharacteristics(data.characteristics || []);
                        } else if (q.type === 'expected_not_expected') {
                            setConditionName(data.condition_name || '');
                            setExpectedFindings(data.findings || []);
                        } else if (q.type === 'indicated_not_indicated') {
                            setClinicalSituation(data.clinical_situation || '');
                            setIndicatedInterventions(data.interventions || []);
                        } else if (q.type === 'sata') {
                            setSataPrompt(data.prompt || '');
                            setSataOptions(data.options || []);
                        } else if (q.type === 'priority_action') {
                            setEmergencyScenario(data.emergency_scenario || '');
                            setPriorityActions(data.actions || []);
                        } else if (q.type === 'case_study') {
                            setCasePatientInfo(data.patient_info || '');
                            setCaseHistory(data.history || '');
                            setCaseVitals(data.vital_signs || { bp: '', hr: '', rr: '', temp: '', spo2: '' });
                            setCaseLabs(data.lab_values || '');
                            setCaseAssessment(data.assessment_findings || '');
                            setCasePrimaryCondition(data.primary_condition || '');

                            // Fetch sub-questions for case study
                            const { data: subData } = await supabase
                                .from('case_study_sub_questions')
                                .select('*')
                                .eq('case_study_id', data.id)
                                .order('question_order', { ascending: true });

                            if (subData) {
                                setCaseSubQuestions(subData.map((sq: any) => ({
                                    id: sq.id,
                                    questionOrder: sq.question_order,
                                    focusArea: sq.focus_area,
                                    questionText: sq.question_text,
                                    subQuestionType: sq.sub_question_type,
                                    options: sq.options,
                                    correctAnswer: sq.correct_answer,
                                    rationale: sq.rationale
                                })));
                            }
                        }
                    } else if (q.type === 'sentence_completion' && q.dropdownGroups) {
                        // Fallback to local data if available (e.g. just created)
                        setSentenceTemplate(q.sentenceTemplate || '');
                        setDropdownGroups(q.dropdownGroups);
                    } else if (q.type === 'drag_drop_priority' && q.dragDropItems) {
                        setDragDropItems(q.dragDropItems);
                        setDragDropZones(q.dragDropZones || []);
                    }
                    // ... Add other fallbacks if needed, but fetch should usually work.
                }
            }

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Error loading question for edit:', error);
            alert('Failed to load question details.');
        }
    };

    // Matrix element handlers
    const addMatrixRow = () => {
        setMatrixRows([...matrixRows, { id: `row${matrixRows.length + 1}`, text: '', correctColumnId: '' }]);
    };

    const removeMatrixRow = (index: number) => {
        if (matrixRows.length > 1) {
            setMatrixRows(matrixRows.filter((_, i) => i !== index));
        }
    };

    const updateMatrixRow = (index: number, field: keyof MatrixRow, value: string) => {
        const newRows = [...matrixRows];
        newRows[index] = { ...newRows[index], [field]: value };
        setMatrixRows(newRows);
    };

    const updateMatrixColumn = (index: number, value: string) => {
        const newCols = [...matrixColumns];
        newCols[index] = { ...newCols[index], label: value };
        setMatrixColumns(newCols);
    };

    // Ordering handlers
    const addOrderingItem = () => {
        setOrderingItems([...orderingItems, { id: `item${orderingItems.length + 1}`, text: '' }]);
    };

    const removeOrderingItem = (index: number) => {
        if (orderingItems.length > 2) {
            setOrderingItems(orderingItems.filter((_, i) => i !== index));
        }
    };

    const updateOrderingItem = (index: number, value: string) => {
        const newItems = [...orderingItems];
        newItems[index] = { ...newItems[index], text: value };
        setOrderingItems(newItems);
    };

    // Clinical: Helper Functions

    // Sentence Completion
    const addDropdownGroup = () => {
        setDropdownGroups([...dropdownGroups, {
            id: (dropdownGroups.length + 1).toString(),
            options: ['', '', '', ''],
            correctAnswer: ''
        }]);
        setSentenceTemplate(prev => prev + ` {{${dropdownGroups.length + 1}}} `);
    };

    const updateDropdownGroup = (index: number, field: keyof DropdownGroup, value: any) => {
        const newGroups = [...dropdownGroups];
        newGroups[index] = { ...newGroups[index], [field]: value };
        setDropdownGroups(newGroups);
    };

    // Drag Drop
    const addDragDropItem = () => {
        setDragDropItems([...dragDropItems, {
            id: `item${dragDropItems.length + 1}`,
            text: '',
            requiresFollowup: false
        }]);
    };

    const updateDragDropItem = (index: number, field: keyof DragDropItem, value: any) => {
        const newItems = [...dragDropItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setDragDropItems(newItems);
    };

    // Compare Classify
    const addCompareCharacteristic = () => {
        setCompareCharacteristics([...compareCharacteristics, {
            id: `char${compareCharacteristics.length + 1}`,
            text: '',
            appliesTo: []
        }]);
    };

    const updateCompareCharacteristic = (index: number, field: keyof ClassificationCharacteristic, value: any) => {
        const newChars = [...compareCharacteristics];
        newChars[index] = { ...newChars[index], [field]: value };
        setCompareCharacteristics(newChars);
    };

    // Expected Findings
    const addExpectedFinding = () => {
        setExpectedFindings([...expectedFindings, {
            id: `find${expectedFindings.length + 1}`,
            text: '',
            isExpected: true
        }]);
    };

    const updateExpectedFinding = (index: number, field: keyof ExpectedFinding, value: any) => {
        const newFindings = [...expectedFindings];
        newFindings[index] = { ...newFindings[index], [field]: value };
        setExpectedFindings(newFindings);
    };

    // Indicated Interventions
    const addIndicatedIntervention = () => {
        setIndicatedInterventions([...indicatedInterventions, {
            id: `int${indicatedInterventions.length + 1}`,
            text: '',
            isIndicated: true,
            rationale: ''
        }]);
    };

    const updateIndicatedIntervention = (index: number, field: keyof IndicatedIntervention, value: any) => {
        const newInterventions = [...indicatedInterventions];
        newInterventions[index] = { ...newInterventions[index], [field]: value };
        setIndicatedInterventions(newInterventions);
    };

    // SATA
    const addSataOption = () => {
        setSataOptions([...sataOptions, {
            id: `opt${sataOptions.length + 1}`,
            text: '',
            isCorrect: false
        }]);
    };

    const updateSataOption = (index: number, field: keyof SataOption, value: any) => {
        const newOptions = [...sataOptions];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setSataOptions(newOptions);
    };

    // Priority Action
    const addPriorityAction = () => {
        setPriorityActions([...priorityActions, {
            id: `act${priorityActions.length + 1}`,
            text: '',
            priorityRank: 0
        }]);
    };

    const updatePriorityAction = (index: number, field: keyof PriorityActionOption, value: any) => {
        const newActions = [...priorityActions];
        newActions[index] = { ...newActions[index], [field]: value };
        setPriorityActions(newActions);
    };

    // Case Study
    const addCaseSubQuestion = () => {
        setCaseSubQuestions([...caseSubQuestions, {
            id: `sq${caseSubQuestions.length + 1}`,
            questionOrder: caseSubQuestions.length + 1,
            focusArea: '',
            questionText: '',
            subQuestionType: 'single', // Align with main types
            options: [],
            correctAnswer: null
        }]);
    };

    const updateCaseSubQuestion = (index: number, field: keyof CaseStudySubQuestion, value: any) => {
        const newSubQ = [...caseSubQuestions];
        newSubQ[index] = { ...newSubQ[index], [field]: value };
        setCaseSubQuestions(newSubQ);
    };

    const handleAddQuestion = async () => {
        if (!questionText || !selectedSubject || !selectedChapter) {
            alert('Please fill all required fields');
            return;
        }

        const isClinical = isClinicalType(questionType);

        if (isClinical) {
            try {
                let questionId = editingQuestionId;

                // 1. Upsert into main clinical_questions table
                const clinicalData = {
                    title: questionText.substring(0, 100) + (questionText.length > 100 ? '...' : ''),
                    instruction: questionText,
                    custom_id: customId,
                    scenario: scenario || null,
                    rationale: rationale || null,
                    client_needs: clientNeeds || null,
                    subject_id: selectedSubject,
                    chapter_id: selectedChapter,
                    question_type: questionType,
                    clinical_topic: 'General', // Default
                    clinical_focus: 'General',  // Default
                    exhibits: exhibits
                };

                if (editingQuestionId) {
                    const { error } = await supabase
                        .from('clinical_questions')
                        .update(clinicalData)
                        .eq('id', editingQuestionId);
                    if (error) throw error;

                    // If editing, we need to handle the specific data. 
                    // To be safe against type changes, we ideally delete from all potential specific tables or just the current one.
                    // For now, we delete from the table matching the CURRENT type, which handles re-insertion/updates.
                    // (Orphaned data from type changes is a tech debt accepted for now).
                } else {
                    const { data: qData, error: qError } = await supabase
                        .from('clinical_questions')
                        .insert([clinicalData])
                        .select()
                        .single();
                    if (qError) throw qError;
                    questionId = qData.id;
                }

                if (!questionId) throw new Error("Failed to get Question ID");

                // 2. Handle specific table
                let specificTable = '';
                let specificData: any = {};

                if (questionType === 'sentence_completion') {
                    specificTable = 'sentence_completion_questions';
                    specificData = {
                        question_id: questionId,
                        sentence_template: sentenceTemplate,
                        dropdown_groups: dropdownGroups.map(g => ({
                            id: g.id,
                            options: g.options,
                            correctAnswer: g.correctAnswer
                        }))
                    };
                } else if (questionType === 'drag_drop_priority') {
                    specificTable = 'drag_drop_priority_questions';
                    specificData = {
                        question_id: questionId,
                        items: dragDropItems,
                        drop_zones: dragDropZones
                    };
                } else if (questionType === 'compare_classify') {
                    specificTable = 'compare_classify_questions';
                    specificData = {
                        question_id: questionId,
                        conditions: compareConditions,
                        characteristics: compareCharacteristics
                    };
                } else if (questionType === 'expected_not_expected') {
                    specificTable = 'expected_finding_questions';
                    specificData = {
                        question_id: questionId,
                        condition_name: conditionName,
                        findings: expectedFindings
                    };
                } else if (questionType === 'indicated_not_indicated') {
                    specificTable = 'indicated_intervention_questions';
                    specificData = {
                        question_id: questionId,
                        clinical_situation: clinicalSituation,
                        interventions: indicatedInterventions
                    };
                } else if (questionType === 'sata') {
                    specificTable = 'sata_questions';
                    specificData = {
                        question_id: questionId,
                        prompt: sataPrompt,
                        options: sataOptions
                    };
                } else if (questionType === 'priority_action') {
                    specificTable = 'priority_action_questions';
                    specificData = {
                        question_id: questionId,
                        emergency_scenario: emergencyScenario,
                        actions: priorityActions
                    };
                } else if (questionType === 'case_study') {
                    // Case study handling
                    specificData = {
                        question_id: questionId,
                        patient_info: casePatientInfo,
                        history: caseHistory,
                        vital_signs: caseVitals,
                        lab_values: caseLabs || null,
                        assessment_findings: caseAssessment,
                        primary_condition: casePrimaryCondition || 'Unknown'
                    };

                    // For case study, we check if main record exists (by question_id), update or insert
                    const { data: existingCase } = await supabase.from('case_study_questions').select('id').eq('question_id', questionId).single();

                    let caseStudyId = existingCase?.id;

                    if (existingCase) {
                        await supabase.from('case_study_questions').update(specificData).eq('id', existingCase.id);
                        // Delete old sub-questions to replace
                        await supabase.from('case_study_sub_questions').delete().eq('case_study_id', existingCase.id);
                    } else {
                        const { data: newCase, error: caseError } = await supabase.from('case_study_questions').insert([specificData]).select().single();
                        if (caseError) throw caseError;
                        caseStudyId = newCase.id;
                    }

                    // Insert sub-questions
                    if (caseSubQuestions.length > 0 && caseStudyId) {
                        const subQData = caseSubQuestions.map(sq => ({
                            case_study_id: caseStudyId,
                            question_order: sq.questionOrder,
                            focus_area: sq.focusArea,
                            question_text: sq.questionText,
                            sub_question_type: sq.subQuestionType,
                            options: sq.options || [],
                            correct_answer: sq.correctAnswer,
                            rationale: sq.rationale
                        }));
                        const { error: subQError } = await supabase
                            .from('case_study_sub_questions')
                            .insert(subQData);
                        if (subQError) throw subQError;
                    }
                    specificTable = ''; // Handled manually
                }

                if (specificTable) {
                    if (editingQuestionId) {
                        // Delete existing entries for this question in the specific table to allow clean re-insertion
                        // (This assumes 1:1 or 1:N relationship is fully owned by the question_id)
                        await supabase.from(specificTable).delete().eq('question_id', questionId);
                    }
                    const { error: specError } = await supabase.from(specificTable).insert([specificData]);
                    if (specError) throw specError;
                }

                // Prepare local object
                const newQuestion: Question = {
                    id: questionId,
                    type: questionType,
                    text: questionText,
                    subjectId: selectedSubject,
                    chapterId: selectedChapter,
                    customId: customId,
                    options: [],
                    correctOptions: [],
                    rationale: rationale || undefined,
                    clientNeeds: clientNeeds || undefined,
                    scenario: scenario || undefined,
                    exhibits: exhibits,
                    // If simple clinical types, we might want to store more data locally, but for now this matches original logic
                };

                if (editingQuestionId) {
                    setQuestions(questions.map(q => q.id === editingQuestionId ? newQuestion : q));
                    alert('Clinical Question Updated Successfully!');
                } else {
                    setQuestions([...questions, newQuestion]);
                    alert('Clinical Question Saved Successfully!');
                }

                handleCancelEdit();

            } catch (err: any) {
                console.error('Error saving clinical question:', err);
                alert('Error saving clinical question: ' + (err.message || 'Unknown error'));
            }
            return;
        }

        // Standard Questions Logic
        if (questionType === 'diagram') {
            const hasEmptyLabels = diagramElements.some(el => !el.label.trim());
            const hasEmptyOptions = diagramElements.some(el => el.options.some(opt => !opt.trim()));
            const hasNoCorrectAnswer = diagramElements.some(el => !el.correctAnswer);

            if (hasEmptyLabels || hasEmptyOptions || hasNoCorrectAnswer) {
                alert('Please fill all diagram element fields and select correct answers');
                return;
            }
        } else if (questionType === 'cloze') {
            if (!clozeText.trim()) {
                alert('Please enter the text for the fill-in-the-blanks question');
                return;
            }
            const hasEmptyOptions = clozeElements.some(el => el.options.some(opt => !opt.trim()));
            const hasNoCorrectAnswer = clozeElements.some(el => !el.correctAnswer);

            if (hasEmptyOptions || hasNoCorrectAnswer) {
                alert('Please fill all options and select correct answers for all blanks');
                return;
            }
        } else if (questionType === 'matrix') {
            const hasEmptyRows = matrixRows.some(row => !row.text.trim());
            const hasNoCorrectAnswer = matrixRows.some(row => !row.correctColumnId);
            const hasEmptyCols = matrixColumns.some(col => !col.label.trim());

            if (hasEmptyRows || hasNoCorrectAnswer || hasEmptyCols) {
                alert('Please fill all matrix rows, columns and select correct answers');
                return;
            }
        } else if (questionType === 'ordering') {
            if (orderingItems.some(item => !item.text.trim())) {
                alert('Please fill all ordering items');
                return;
            }
        } else if (questionType === 'input') {
            if (!correctAnswerInput.trim()) {
                alert('Please enter the correct answer');
                return;
            }
        } else if (options.some(opt => !opt)) {
            alert('Please fill all options');
            return;
        }

        const questionData = {
            type: questionType,
            text: questionText,
            custom_id: customId,
            options: (['diagram', 'cloze', 'matrix', 'ordering', 'input'].includes(questionType)) ? [] : options,
            correct_options: (['diagram', 'cloze', 'matrix', 'ordering', 'input'].includes(questionType)) ? [] : correctOptions,
            subject_id: selectedSubject,
            chapter_id: selectedChapter,
            exhibits: exhibits,
            exhibit_content: exhibits.length > 0 ? exhibits[0].content : (exhibitContent.trim() || null), // Fallback
            diagram_type: questionType === 'diagram' ? diagramType : null,
            diagram_elements: questionType === 'diagram' ? diagramElements : null,
            cloze_text: questionType === 'cloze' ? clozeText : null,
            cloze_elements: questionType === 'cloze' ? clozeElements : null,
            matrix_columns: questionType === 'matrix' ? matrixColumns : null,
            matrix_rows: questionType === 'matrix' ? matrixRows : null,
            ordering_items: questionType === 'ordering' ? orderingItems : null,
            correct_answer_input: questionType === 'input' ? correctAnswerInput : null,
            answer_tolerance: questionType === 'input' ? (answerTolerance || 0) : null,
            input_unit: questionType === 'input' ? inputUnit : null,
            rationale: rationale || null,
            scenario: scenario || null,
            client_needs: clientNeeds || null
        };

        if (editingQuestionId) {
            const { error } = await supabase
                .from('questions')
                .update(questionData)
                .eq('id', editingQuestionId);

            if (error) {
                console.error('Error updating question:', error);
                alert('Error updating question: ' + error.message);
                return;
            }

            // Construct updated object
            const updatedQuestion: Question = {
                id: editingQuestionId,
                type: questionType,
                text: questionText,
                options: questionData.options || [],
                correctOptions: questionData.correct_options || [],
                subjectId: selectedSubject,
                chapterId: selectedChapter,
                customId: customId,
                exhibits: exhibits,
                exhibitContent: questionData.exhibit_content || undefined,
                diagramUrl: undefined,
                diagramType: questionType === 'diagram' ? diagramType : undefined,
                diagramElements: questionType === 'diagram' ? diagramElements : undefined,
                clozeText: questionType === 'cloze' ? clozeText : undefined,
                clozeElements: questionType === 'cloze' ? clozeElements : undefined,
                matrixColumns: questionType === 'matrix' ? matrixColumns : undefined,
                matrixRows: questionType === 'matrix' ? matrixRows : undefined,
                orderingItems: questionType === 'ordering' ? orderingItems : undefined,
                correctOrder: undefined,
                correctAnswerInput: questionType === 'input' ? correctAnswerInput : undefined,
                answerTolerance: questionType === 'input' ? answerTolerance : undefined,
                inputUnit: questionType === 'input' ? inputUnit : undefined,
                rationale: rationale || undefined
            };

            setQuestions(questions.map(q => q.id === editingQuestionId ? updatedQuestion : q));
            alert('Question Updated Successfully!');

        } else {
            const { data, error } = await supabase
                .from('questions')
                .insert([questionData])
                .select();

            if (error) {
                console.error('Error saving question:', error);
                alert('Error saving question: ' + error.message);
                return;
            }

            if (data) {
                const savedQuestion = data[0];
                const newQuestion: Question = {
                    id: savedQuestion.id,
                    type: savedQuestion.type,
                    text: savedQuestion.text,
                    options: savedQuestion.options || [],
                    correctOptions: savedQuestion.correct_options || [],
                    subjectId: savedQuestion.subject_id,
                    chapterId: savedQuestion.chapter_id,
                    customId: savedQuestion.custom_id,
                    exhibits: savedQuestion.exhibits,
                    exhibitContent: savedQuestion.exhibit_content,
                    diagramUrl: savedQuestion.diagram_url,
                    diagramType: savedQuestion.diagram_type,
                    diagramElements: savedQuestion.diagram_elements,
                    clozeText: savedQuestion.cloze_text,
                    clozeElements: savedQuestion.cloze_elements,
                    matrixColumns: savedQuestion.matrix_columns,
                    matrixRows: savedQuestion.matrix_rows,
                    orderingItems: savedQuestion.ordering_items,
                    correctOrder: savedQuestion.correct_order,
                    correctAnswerInput: savedQuestion.correct_answer_input,
                    answerTolerance: savedQuestion.answer_tolerance,
                    inputUnit: savedQuestion.input_unit,
                    rationale: savedQuestion.rationale
                };
                setQuestions([...questions, newQuestion]);
                alert('Question Saved Successfully!');
            }
        }

        handleCancelEdit();
    };

    const activeSubject = subjects.find(s => s.id === selectedSubject);

    // Sort subjects and chapters alphabetically
    const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name));
    const sortedChapters = activeSubject?.chapters
        ? [...activeSubject.chapters].sort((a, b) => a.name.localeCompare(b.name))
        : [];

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.2 }} className="text-gradient">
                        Question Bank
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Create and manage your assessment content
                    </p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        border: 'var(--glass-border)',
                        fontSize: '0.9rem',
                        color: 'var(--text-accent)'
                    }}>
                        Total Questions: {questions.length}
                    </div>
                    {onRefresh && (
                        <button
                            onClick={async () => {
                                await onRefresh();
                                alert('Data refreshed! All questions loaded from database.');
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                            </svg>
                            Refresh
                        </button>
                    )}
                </div>
            </div>

            <div style={{
                background: 'var(--bg-card)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: 'var(--glass-border)',
                marginBottom: '3rem',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle at 70% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 60%)',
                    pointerEvents: 'none'
                }} />

                <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: 'var(--gradient-primary)', width: '8px', height: '32px', borderRadius: '4px', display: 'block' }}></span>
                    Create New Question
                </h3>

                {/* Question Type Selector */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Question Type
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {(['single', 'multiple', 'diagram', 'cloze', 'matrix', 'ordering', 'input',
                            'sentence_completion', 'drag_drop_priority', 'compare_classify',
                            'expected_not_expected', 'indicated_not_indicated', 'sata',
                            'priority_action', 'case_study'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setQuestionType(type);
                                        setCorrectOptions([0]);
                                    }}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: questionType === type ? '2px solid #a855f7' : '2px solid var(--border-color)',
                                        background: questionType === type ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                                        color: questionType === type ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        flexDirection: 'column',
                                        minHeight: '100px'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>
                                        {type === 'sentence_completion' ? '🧩' :
                                            type === 'drag_drop_priority' ? '✋' :
                                                type === 'compare_classify' ? '⚖️' :
                                                    type === 'expected_not_expected' ? '🔍' :
                                                        type === 'indicated_not_indicated' ? '✅' :
                                                            type === 'sata' ? '☑️' :
                                                                type === 'priority_action' ? '⚡' :
                                                                    type === 'case_study' ? '📋' :
                                                                        type === 'single' ? '◉' : type === 'multiple' ? '☑' : type === 'diagram' ? '📊' : type === 'cloze' ? '📝' : type === 'matrix' ? '▦' : type === 'ordering' ? '⇅' : '⌨'}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                        {type === 'sentence_completion' ? 'Sentence Comp.' :
                                            type === 'drag_drop_priority' ? 'Drag Priority' :
                                                type === 'compare_classify' ? 'Compare/Classify' :
                                                    type === 'expected_not_expected' ? 'Expected/Not' :
                                                        type === 'indicated_not_indicated' ? 'Indicated/Not' :
                                                            type === 'sata' ? 'SATA' :
                                                                type === 'priority_action' ? 'Priority Action' :
                                                                    type === 'case_study' ? 'Case Study' :
                                                                        type === 'single' ? 'Single Choice' : type === 'multiple' ? 'Multiple Choice' : type === 'diagram' ? 'Flowchart' : type === 'cloze' ? 'Fill Blanks' : type === 'matrix' ? 'Matrix' : type === 'ordering' ? 'Ordering' : 'Input/Calc'}
                                    </span>
                                </button>
                            ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => {
                                setSelectedSubject(e.target.value);
                                setSelectedChapter('');
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">Select Subject</option>
                            {sortedSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chapter</label>
                        <select
                            value={selectedChapter}
                            onChange={(e) => setSelectedChapter(e.target.value)}
                            disabled={!selectedSubject}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                opacity: !selectedSubject ? 0.5 : 1,
                                outline: 'none',
                                cursor: !selectedSubject ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <option value="">Select Chapter</option>
                            {sortedChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Custom ID (Optional)</label>
                    <input
                        type="text"
                        value={customId}
                        onChange={(e) => setCustomId(e.target.value)}
                        placeholder="e.g., MATH-101-A"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'white',
                            outline: 'none',
                            fontFamily: 'monospace'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {questionType === 'cloze' ? 'Instructions' : 'Question Text'}
                    </label>
                    <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'white',
                            resize: 'vertical',
                            minHeight: '100px',
                            fontSize: '1rem'
                        }}
                        placeholder={questionType === 'cloze' ? "e.g., Complete the following sentences from the list of options." : "Type your question here..."}
                    />
                </div>

                {/* Exhibit Content */}
                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                            Exhibits (Optional)
                        </label>
                        <button
                            onClick={() => setExhibits([...exhibits, { id: Date.now().toString(), title: '', content: '' }])}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'rgba(14, 165, 233, 0.1)',
                                border: '1px solid rgba(14, 165, 233, 0.3)',
                                borderRadius: 'var(--radius-md)',
                                color: '#0ea5e9',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600
                            }}
                        >
                            + Add Exhibit
                        </button>
                    </div>

                    {exhibits.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            No exhibits added. Click the button above to add patient charts, lab results, or other reference material.
                        </p>
                    )}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {exhibits.map((exhibit, idx) => (
                            <div key={exhibit.id} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={exhibit.title}
                                        onChange={(e) => {
                                            const newExhibits = [...exhibits];
                                            newExhibits[idx].title = e.target.value;
                                            setExhibits(newExhibits);
                                        }}
                                        placeholder="Exhibit Title (e.g. Lab Results)"
                                        style={{
                                            fontWeight: 600,
                                            color: 'white',
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: '1px dashed var(--text-secondary)',
                                            width: '70%',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={() => setExhibits(exhibits.filter((_, i) => i !== idx))}
                                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        const newExhibits = [...exhibits];
                                        newExhibits[idx].content = e.currentTarget.innerHTML;
                                        setExhibits(newExhibits);
                                    }}
                                    dangerouslySetInnerHTML={{ __html: exhibit.content }}
                                    style={{
                                        width: '100%',
                                        minHeight: '300px',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'white',
                                        resize: 'vertical',
                                        overflow: 'auto',
                                        outline: 'none'
                                    }}
                                    className="exhibit-editor"
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Tip: You can paste tables directly from Excel, Word, or Google Sheets into the box above.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cloze-specific fields */}
                {questionType === 'cloze' && (
                    <>
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Paragraph Text</label>
                                <button
                                    onClick={addClozeBlank}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                        borderRadius: 'var(--radius-md)',
                                        color: '#38bdf8',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 600
                                    }}
                                >
                                    + Insert Blank
                                </button>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Use the "Insert Blank" button to add a placeholder like <code>{'{{1}}'}</code> where you want a dropdown.
                            </p>
                            <textarea
                                value={clozeText}
                                onChange={(e) => setClozeText(e.target.value)}
                                rows={6}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    resize: 'vertical',
                                    fontSize: '1rem',
                                    fontFamily: 'monospace',
                                    lineHeight: 1.6
                                }}
                                placeholder="The client has most likely developed {{1}}, the nurse should immediately take action to {{2}}..."
                            />
                        </div>

                        {clozeElements.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ color: 'var(--text-accent)', fontWeight: 600, marginBottom: '1rem' }}>
                                    Configure Blanks
                                </h4>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {clozeElements.map((element, idx) => (
                                        <div key={element.id} style={{
                                            background: 'var(--bg-secondary)',
                                            padding: '1.5rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{ marginBottom: '1rem', fontWeight: 600, color: '#38bdf8' }}>
                                                Blank {`{{${element.id}}}`}
                                            </div>

                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                    Dropdown Options
                                                </label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    {element.options.map((opt, optIdx) => (
                                                        <input
                                                            key={optIdx}
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => updateClozeElementOption(idx, optIdx, e.target.value)}
                                                            placeholder={`Option ${optIdx + 1}`}
                                                            style={{
                                                                padding: '0.75rem',
                                                                borderRadius: 'var(--radius-sm)',
                                                                background: 'var(--bg-primary)',
                                                                border: '1px solid var(--border-color)',
                                                                color: 'white',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                    Correct Answer
                                                </label>
                                                <select
                                                    value={element.correctAnswer}
                                                    onChange={(e) => updateClozeElementCorrectAnswer(idx, e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        background: 'var(--bg-primary)',
                                                        border: '1px solid #22c55e',
                                                        color: 'white',
                                                        outline: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="">Select correct answer...</option>
                                                    {element.options.filter(opt => opt.trim()).map((opt, optIdx) => (
                                                        <option key={optIdx} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Matrix-specific fields */}
                {questionType === 'matrix' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                                Matrix Configuration
                            </label>
                        </div>

                        {/* Column Headers */}
                        <div style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Column Headers
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {matrixColumns.map((col, idx) => (
                                    <input
                                        key={col.id}
                                        type="text"
                                        value={col.label}
                                        onChange={(e) => updateMatrixColumn(idx, e.target.value)}
                                        placeholder={`Column ${idx + 1}`}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-color)',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Rows */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Rows</label>
                                <button
                                    onClick={addMatrixRow}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                        borderRadius: '4px',
                                        color: '#22c55e',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    + Add Row
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {matrixRows.map((row, idx) => (
                                    <div key={row.id} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr auto',
                                        gap: '1rem',
                                        alignItems: 'center',
                                        background: 'var(--bg-secondary)',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <input
                                            type="text"
                                            value={row.text}
                                            onChange={(e) => updateMatrixRow(idx, 'text', e.target.value)}
                                            placeholder="Enter row text (e.g., Establish vascular access)"
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border-color)',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        />

                                        <select
                                            value={row.correctColumnId}
                                            onChange={(e) => updateMatrixRow(idx, 'correctColumnId', e.target.value)}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'var(--bg-primary)',
                                                border: '1px solid #22c55e',
                                                color: 'white',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="">Select Answer</option>
                                            {matrixColumns.map(col => (
                                                <option key={col.id} value={col.id}>{col.label}</option>
                                            ))}
                                        </select>

                                        {matrixRows.length > 1 && (
                                            <button
                                                onClick={() => removeMatrixRow(idx)}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '4px',
                                                    color: '#ef4444',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Ordering-specific fields */}
                {questionType === 'ordering' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                                Ordering Items (In Correct Order)
                            </label>
                            <button
                                onClick={addOrderingItem}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: 'var(--radius-md)',
                                    color: '#22c55e',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 600
                                }}
                            >
                                + Add Item
                            </button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Enter the items in the correct sequence. They will be shuffled for the student.
                        </p>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {orderingItems.map((item, idx) => (
                                <div key={item.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', width: '20px' }}>{idx + 1}.</span>
                                    <input
                                        type="text"
                                        value={item.text}
                                        onChange={(e) => updateOrderingItem(idx, e.target.value)}
                                        placeholder={`Step ${idx + 1}`}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    />
                                    {orderingItems.length > 2 && (
                                        <button
                                            onClick={() => removeOrderingItem(idx)}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '4px',
                                                color: '#ef4444',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input-specific fields */}
                {questionType === 'input' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Correct Answer
                                </label>
                                <input
                                    type="text"
                                    value={correctAnswerInput}
                                    onChange={(e) => setCorrectAnswerInput(e.target.value)}
                                    placeholder="e.g., 4.6"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Unit (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={inputUnit}
                                    onChange={(e) => setInputUnit(e.target.value)}
                                    placeholder="e.g., units/hr"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Numeric Tolerance (Optional)
                            </label>
                            <input
                                type="number"
                                value={answerTolerance}
                                onChange={(e) => setAnswerTolerance(parseFloat(e.target.value))}
                                placeholder="e.g., 0.1"
                                step="0.1"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                If the answer is numeric, this allows for a range of correct answers (e.g., Answer ± Tolerance).
                            </p>
                        </div>
                    </div>
                )}

                {/* CLINICAL SPECIFIC FIELDS */}

                {/* 1. Sentence Completion */}
                {questionType === 'sentence_completion' && (
                    <div style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px', color: '#a5b4fc' }}>
                            <p style={{ margin: 0 }}><strong>Instruction:</strong> Use "Insert Dropdown" to add a placeholder. The text <code>{'{{1}}'}</code> corresponds to Dropdown 1.</p>
                        </div>
                        <h4 style={{ color: '#a5b4fc', marginBottom: '1rem' }}>Sentence Template & Dropdowns</h4>
                        <textarea
                            value={sentenceTemplate}
                            onChange={(e) => setSentenceTemplate(e.target.value)}
                            rows={3}
                            placeholder="e.g. A patient with {{1}} should take {{2}}."
                            style={{ width: '100%', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        />
                        <button onClick={addDropdownGroup} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Dropdown Group</button>
                        {dropdownGroups.map((group, idx) => (
                            <div key={group.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#a5b4fc' }}>Dropdown {idx + 1} ({`{{${group.id}}}`})</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {group.options.map((opt, optIdx) => (
                                        <input key={optIdx} value={opt} onChange={e => {
                                            const newOpts = [...group.options]; newOpts[optIdx] = e.target.value;
                                            updateDropdownGroup(idx, 'options', newOpts);
                                        }} placeholder={`Option ${optIdx + 1}`} style={{ padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                                    ))}
                                </div>
                                <select value={group.correctAnswer} onChange={e => updateDropdownGroup(idx, 'correctAnswer', e.target.value)} style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', color: 'white', borderRadius: '4px', border: '1px solid #22c55e' }}>
                                    <option value="">Select Correct Answer</option>
                                    {group.options.filter(o => o).map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Drag & Drop */}
                {questionType === 'drag_drop_priority' && (
                    <div style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <h4 style={{ color: '#a5b4fc', marginBottom: '1rem' }}>Drag Items Configuration</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Define items and specify if they belong to the priority zone (Immediate Follow-up).</p>

                        <button onClick={addDragDropItem} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Item</button>

                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {dragDropItems.map((item, idx) => (
                                <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '4px' }}>
                                    <input value={item.text} onChange={e => updateDragDropItem(idx, 'text', e.target.value)} placeholder="Item text" style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: item.requiresFollowup ? '#22c55e' : 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={item.requiresFollowup} onChange={e => updateDragDropItem(idx, 'requiresFollowup', e.target.checked)} />
                                        Requires Priority?
                                    </label>
                                    <button onClick={() => { const n = [...dragDropItems]; n.splice(idx, 1); setDragDropItems(n); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Compare & Classify */}
                {questionType === 'compare_classify' && (
                    <div style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <h4 style={{ color: '#a5b4fc', marginBottom: '1rem' }}>Compare & Classify</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a5b4fc' }}>Condition 1 Name</label>
                                <input value={compareConditions[0].name} onChange={e => { const newC = [...compareConditions]; newC[0].name = e.target.value; setCompareConditions(newC); }} placeholder="e.g. Ulcerative Colitis" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a5b4fc' }}>Condition 2 Name</label>
                                <input value={compareConditions[1].name} onChange={e => { const newC = [...compareConditions]; newC[1].name = e.target.value; setCompareConditions(newC); }} placeholder="e.g. Crohn's Disease" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                            </div>
                        </div>

                        <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Characteristics</h5>
                        <button onClick={addCompareCharacteristic} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Characteristic</button>

                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {compareCharacteristics.map((char, idx) => (
                                <div key={char.id} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                    <input value={char.text} onChange={e => updateCompareCharacteristic(idx, 'text', e.target.value)} placeholder="Characteristic description" style={{ width: '100%', marginBottom: '0.75rem', padding: '0.5rem', background: 'var(--bg-secondary)', color: 'white', border: 'none', borderRadius: '4px' }} />
                                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Applies to:</span>
                                        {compareConditions.map(cond => (
                                            <label key={cond.id} style={{ color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                                                <input type="checkbox"
                                                    checked={char.appliesTo?.includes(cond.id)}
                                                    onChange={e => {
                                                        const current = char.appliesTo || [];
                                                        const newApplies = e.target.checked ? [...current, cond.id] : current.filter(id => id !== cond.id);
                                                        updateCompareCharacteristic(idx, 'appliesTo', newApplies);
                                                    }}
                                                />
                                                {cond.name || cond.id}
                                            </label>
                                        ))}
                                        <button onClick={() => { const n = [...compareCharacteristics]; n.splice(idx, 1); setCompareCharacteristics(n); }} style={{ marginLeft: 'auto', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Expected Findings */}
                {questionType === 'expected_not_expected' && (
                    <div style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a5b4fc' }}>Clinical Condition</label>
                        <input value={conditionName} onChange={e => setConditionName(e.target.value)} placeholder="Condition Name (e.g. Left-Sided Heart Failure)" style={{ marginBottom: '1.5rem', width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />

                        <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Findings</h5>
                        <button onClick={addExpectedFinding} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Finding</button>

                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {expectedFindings.map((find, idx) => (
                                <div key={find.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '4px' }}>
                                    <input value={find.text} onChange={e => updateExpectedFinding(idx, 'text', e.target.value)} placeholder="Finding description" style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                                    <select value={find.isExpected ? 'true' : 'false'} onChange={e => updateExpectedFinding(idx, 'isExpected', e.target.value === 'true')} style={{ padding: '0.5rem', background: find.isExpected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                        <option value="true">Expected</option>
                                        <option value="false">Not Expected</option>
                                    </select>
                                    <button onClick={() => { const n = [...expectedFindings]; n.splice(idx, 1); setExpectedFindings(n); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Indicated Interventions */}
                {questionType === 'indicated_not_indicated' && (
                    <div style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a5b4fc' }}>Clinical Situation</label>
                        <input value={clinicalSituation} onChange={e => setClinicalSituation(e.target.value)} placeholder="e.g. Patient with severe sepsis..." style={{ marginBottom: '1.5rem', width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />

                        <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Interventions</h5>
                        <button onClick={addIndicatedIntervention} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Intervention</button>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {indicatedInterventions.map((int, idx) => (
                                <div key={int.id} style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <input value={int.text} onChange={e => updateIndicatedIntervention(idx, 'text', e.target.value)} placeholder="Intervention description" style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-secondary)', border: 'none', color: 'white', borderRadius: '4px' }} />
                                        <select value={int.isIndicated ? 'true' : 'false'} onChange={e => updateIndicatedIntervention(idx, 'isIndicated', e.target.value === 'true')} style={{ padding: '0.5rem', background: int.isIndicated ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                            <option value="true">Indicated</option>
                                            <option value="false">Not Indicated</option>
                                        </select>
                                        <button onClick={() => { const n = [...indicatedInterventions]; n.splice(idx, 1); setIndicatedInterventions(n); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                    </div>
                                    <input value={int.rationale || ''} onChange={e => updateIndicatedIntervention(idx, 'rationale', e.target.value)} placeholder="Rationale (optional)" style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', borderRadius: '4px', fontSize: '0.9rem' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. SATA */}
                {questionType === 'sata' && (
                    <div style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a5b4fc' }}>Question Prompt</label>
                        <input value={sataPrompt} onChange={e => setSataPrompt(e.target.value)} placeholder="e.g. Which of the following findings require immediate reporting?" style={{ marginBottom: '1.5rem', width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />

                        <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Options</h5>
                        <button onClick={addSataOption} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Option</button>

                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {sataOptions.map((opt, idx) => (
                                <div key={opt.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '4px' }}>
                                    <input value={opt.text} onChange={e => updateSataOption(idx, 'text', e.target.value)} placeholder="Option text" style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: opt.isCorrect ? '#22c55e' : 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={opt.isCorrect} onChange={e => updateSataOption(idx, 'isCorrect', e.target.checked)} />
                                        Correct
                                    </label>
                                    <button onClick={() => { const n = [...sataOptions]; n.splice(idx, 1); setSataOptions(n); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 7. Priority Action */}
                {questionType === 'priority_action' && (
                    <div style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a5b4fc' }}>Emergency Scenario</label>
                        <textarea value={emergencyScenario} onChange={e => setEmergencyScenario(e.target.value)} placeholder="Describe the emergency situation details..." style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} rows={3} />

                        <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Actions (Rank 1 = Most Important)</h5>
                        <button onClick={addPriorityAction} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Action</button>

                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {priorityActions.map((act, idx) => (
                                <div key={act.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a5b4fc' }}>#{act.priorityRank}</span>
                                    <input value={act.text} onChange={e => updatePriorityAction(idx, 'text', e.target.value)} placeholder="Action text" style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                                    <input type="number" value={act.priorityRank} onChange={e => updatePriorityAction(idx, 'priorityRank', parseInt(e.target.value))} placeholder="Rank" style={{ width: '60px', padding: '0.5rem', background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                                    <button onClick={() => { const n = [...priorityActions]; n.splice(idx, 1); setPriorityActions(n); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Note: Assign strict ranks 1, 2, 3... for dragging order.</p>
                    </div>
                )}

                {/* 8. Case Study */}
                {questionType === 'case_study' && (
                    <div style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <h4 style={{ color: '#a5b4fc', marginBottom: '1rem' }}>Patient Case Data</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <textarea value={casePatientInfo} onChange={e => setCasePatientInfo(e.target.value)} placeholder="Patient Info (Age, Gender, CC)" style={{ padding: '0.75rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} rows={3} />
                            <textarea value={caseHistory} onChange={e => setCaseHistory(e.target.value)} placeholder="Medical History" style={{ padding: '0.75rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} rows={3} />
                        </div>

                        <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Vital Signs</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input value={caseVitals.bp} onChange={e => setCaseVitals({ ...caseVitals, bp: e.target.value })} placeholder="BP (120/80)" style={{ padding: '0.5rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                            <input value={caseVitals.hr} onChange={e => setCaseVitals({ ...caseVitals, hr: e.target.value })} placeholder="HR (80)" style={{ padding: '0.5rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                            <input value={caseVitals.rr} onChange={e => setCaseVitals({ ...caseVitals, rr: e.target.value })} placeholder="RR (16)" style={{ padding: '0.5rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                            <input value={caseVitals.temp} onChange={e => setCaseVitals({ ...caseVitals, temp: e.target.value })} placeholder="Temp (37.0)" style={{ padding: '0.5rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                            <input value={caseVitals.spo2} onChange={e => setCaseVitals({ ...caseVitals, spo2: e.target.value })} placeholder="SpO2 (98%)" style={{ padding: '0.5rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                        </div>

                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a5b4fc' }}>Key Assessment Findings</label>
                        <textarea value={caseAssessment} onChange={e => setCaseAssessment(e.target.value)} placeholder="Lung sounds, pupil reaction, skin color..." style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} rows={2} />

                        <div style={{ marginBottom: '2rem', padding: '1rem', borderTop: '1px dashed var(--border-color)' }}>
                            <h4 style={{ color: '#a5b4fc', marginBottom: '1rem' }}>Sub-Questions ({caseSubQuestions.length})</h4>
                            <button onClick={addCaseSubQuestion} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Case Sub-Question</button>

                            {caseSubQuestions.map((sq, idx) => (
                                <div key={sq.id} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: 'bold', color: '#a5b4fc' }}>Q{sq.questionOrder}: {sq.focusArea || 'Focus Area'}</div>
                                        <button onClick={() => { const n = [...caseSubQuestions]; n.splice(idx, 1); setCaseSubQuestions(n); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                    </div>
                                    <input value={sq.focusArea} onChange={e => updateCaseSubQuestion(idx, 'focusArea', e.target.value)} placeholder="Focus Area (e.g. Assessment)" style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--bg-secondary)', color: 'white', borderRadius: '4px', border: 'none' }} />
                                    <input value={sq.questionText} onChange={e => updateCaseSubQuestion(idx, 'questionText', e.target.value)} placeholder="Question Text" style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--bg-secondary)', color: 'white', borderRadius: '4px', border: 'none' }} />

                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <em>(Sub-question options editor simplified for this view. Add options in DB or expand later.)</em>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Diagram-specific fields */}
                {questionType === 'diagram' && (
                    <>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Diagram Type</label>
                            <select
                                value={diagramType}
                                onChange={(e) => setDiagramType(e.target.value as any)}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="flowchart">Flowchart</option>
                                <option value="labeled-diagram">Labeled Diagram</option>
                                <option value="process-flow">Process Flow</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                                    Interactive Elements ({diagramElements.length})
                                </label>
                                <button
                                    onClick={addDiagramElement}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                        borderRadius: 'var(--radius-md)',
                                        color: '#22c55e',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 600
                                    }}
                                >
                                    + Add Step
                                </button>
                            </div>

                            {diagramElements.map((element, elemIdx) => (
                                <div key={element.id} style={{
                                    background: 'var(--bg-secondary)',
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1rem',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ color: 'var(--text-accent)', fontWeight: 600 }}>Step {elemIdx + 1}</h4>
                                        {diagramElements.length > 1 && (
                                            <button
                                                onClick={() => removeDiagramElement(elemIdx)}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '4px',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            Step Label
                                        </label>
                                        <input
                                            type="text"
                                            value={element.label}
                                            onChange={(e) => updateDiagramElement(elemIdx, 'label', e.target.value)}
                                            placeholder="e.g., Step 1: Initial Assessment"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border-color)',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            Dropdown Options
                                        </label>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            {element.options.map((opt, optIdx) => (
                                                <input
                                                    key={optIdx}
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => updateDiagramElementOption(elemIdx, optIdx, e.target.value)}
                                                    placeholder={`Option ${optIdx + 1}`}
                                                    style={{
                                                        padding: '0.75rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        background: 'var(--bg-primary)',
                                                        border: '1px solid var(--border-color)',
                                                        color: 'white',
                                                        outline: 'none'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            Correct Answer
                                        </label>
                                        <select
                                            value={element.correctAnswer}
                                            onChange={(e) => updateDiagramElement(elemIdx, 'correctAnswer', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'var(--bg-primary)',
                                                border: '1px solid #22c55e',
                                                color: 'white',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="">Select correct answer...</option>
                                            {element.options.filter(opt => opt.trim()).map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Options for single/multiple choice */}
                {['single', 'multiple'].includes(questionType) && (
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Answer Options <span style={{ opacity: 0.6 }}>(Select correct answers)</span>
                            </label>
                            <button
                                onClick={() => setOptions([...options, ''])}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: '#818cf8',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                + Add Option
                            </button>
                        </div>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {options.map((opt, idx) => {
                                const isSelected = correctOptions.includes(idx);
                                return (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: isSelected ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                                        transition: 'background 0.2s'
                                    }}>
                                        <div
                                            onClick={() => toggleCorrectOption(idx)}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: questionType === 'single' ? '50%' : '6px',
                                                border: isSelected ? '2px solid #22c55e' : '2px solid var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                background: isSelected ? '#22c55e' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {isSelected && <span style={{ color: 'white', fontSize: '0.8rem' }}>✓</span>}
                                        </div>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            placeholder={`Option ${idx + 1}`}
                                            style={{
                                                flex: 1,
                                                padding: '1rem',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'var(--bg-secondary)',
                                                border: isSelected ? '1px solid #22c55e' : '1px solid var(--border-color)',
                                                color: 'white',
                                                outline: 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                        {options.length > 2 && (
                                            <button
                                                onClick={() => {
                                                    const newOptions = options.filter((_, i) => i !== idx);
                                                    setOptions(newOptions);
                                                    // Adjust correct options indices
                                                    const newCorrect = correctOptions
                                                        .filter(i => i !== idx)
                                                        .map(i => i > idx ? i - 1 : i);
                                                    setCorrectOptions(newCorrect);
                                                }}
                                                style={{
                                                    padding: '0.5rem',
                                                    color: '#ef4444',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '1.2rem'
                                                }}
                                                title="Remove Option"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Explanations & Context (Available for all types) */}
                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: '#a5b4fc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📝</span> Explanations & Context
                    </h4>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            Rationale (Answer Explanation)
                        </label>
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                setRationale(e.currentTarget.innerHTML);
                            }}
                            dangerouslySetInnerHTML={{ __html: rationale }}
                            style={{
                                width: '100%',
                                minHeight: '150px',
                                padding: '0.75rem',
                                borderRadius: '4px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                overflow: 'auto',
                                outline: 'none'
                            }}
                            className="rationale-editor"
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            💡 Tip: You can paste tables directly from Excel/Word, format text, and add HTML content.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Client Needs Category</label>
                            <select
                                value={clientNeeds}
                                onChange={e => setClientNeeds(e.target.value as ClientNeedsCategory)}
                                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                <option value="">Select Category...</option>
                                <optgroup label="Client Needs Categories">
                                    <option value="management_of_care">Management of Care</option>
                                    <option value="safety_infection_control">Safety and Infection Control</option>
                                    <option value="health_promotion_maintenance">Health Promotion and Maintenance</option>
                                    <option value="psychosocial_integrity">Psychosocial Integrity</option>
                                    <option value="basic_care_comfort">Basic Care and Comfort</option>
                                    <option value="pharmacological_parenteral_therapies">Pharmacological and Parenteral Therapies</option>
                                    <option value="reduction_risk_potential">Reduction of Risk Potential</option>
                                    <option value="physiological_adaptation">Physiological Adaptation</option>
                                </optgroup>
                                <optgroup label="Clinical Judgment">
                                    <option value="clinical_judgment">Clinical Judgment (Overall)</option>
                                    <option value="recognize_cues">Recognize Cues</option>
                                    <option value="analyze_cues">Analyze Cues</option>
                                    <option value="prioritize_hypotheses">Prioritize Hypotheses</option>
                                    <option value="generate_solutions">Generate Solutions</option>
                                    <option value="take_actions">Take Actions</option>
                                    <option value="evaluate_outcomes">Evaluate Outcomes</option>
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Scenario Context (Optional)</label>
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                    setScenario(e.currentTarget.innerHTML);
                                }}
                                dangerouslySetInnerHTML={{ __html: scenario }}
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '0.75rem',
                                    borderRadius: '4px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    overflow: 'auto',
                                    outline: 'none'
                                }}
                                className="scenario-editor"
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                💡 Tip: You can paste tables and formatted content here too.
                            </p>
                        </div>
                    </div>
                </div>


                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button
                        className="btn btn-primary"
                        style={{
                            flex: 1,
                            padding: '1rem',
                            fontSize: '1.1rem',
                            letterSpacing: '0.5px'
                        }}
                        onClick={handleAddQuestion}
                    >
                        {editingQuestionId ? 'Update Question' : 'Add Question to Bank'}
                    </button>
                    {editingQuestionId && (
                        <button
                            onClick={handleCancelEdit}
                            style={{
                                padding: '1rem 2rem',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Recent Questions</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Subject Filter */}
                        <select
                            value={filterSubject}
                            onChange={(e) => {
                                setFilterSubject(e.target.value);
                                setFilterChapter(''); // Reset chapter when subject changes
                            }}
                            style={{
                                padding: '0.75rem',
                                background: 'var(--bg-card)',
                                border: 'var(--glass-border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'white',
                                outline: 'none',
                                minWidth: '150px'
                            }}
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        {/* Chapter Filter */}
                        <select
                            value={filterChapter}
                            onChange={(e) => setFilterChapter(e.target.value)}
                            disabled={!filterSubject}
                            style={{
                                padding: '0.75rem',
                                background: !filterSubject ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)',
                                border: 'var(--glass-border)',
                                borderRadius: 'var(--radius-md)',
                                color: !filterSubject ? 'rgba(255,255,255,0.3)' : 'white',
                                outline: 'none',
                                minWidth: '150px',
                                cursor: !filterSubject ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <option value="">All Chapters</option>
                            {filterSubject && subjects.find(s => s.id === filterSubject)?.chapters.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search ID, Text..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    paddingLeft: '2.5rem',
                                    width: '300px',
                                    maxWidth: '100%',
                                    background: 'var(--bg-card)',
                                    border: 'var(--glass-border)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {questions
                        .filter(q => {
                            // Subject Filter
                            if (filterSubject && q.subjectId !== filterSubject) return false;
                            // Chapter Filter
                            if (filterChapter && q.chapterId !== filterChapter) return false;

                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            const subject = subjects.find(s => s.id === q.subjectId);
                            const chapter = subject?.chapters.find(c => c.id === q.chapterId);
                            return (
                                q.id.toLowerCase().includes(query) ||
                                q.customId?.toLowerCase().includes(query) ||
                                q.text.toLowerCase().includes(query) ||
                                (subject && subject.name.toLowerCase().includes(query)) ||
                                (chapter && chapter.name.toLowerCase().includes(query))
                            );
                        })
                        .slice().reverse()
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map(q => (
                            <div key={q.id} style={{
                                padding: '2rem',
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-lg)',
                                border: 'var(--glass-border)',
                                transition: 'transform 0.2s',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '2rem',
                                    right: '2rem',
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center'
                                }}>
                                    <button
                                        onClick={() => handleEditQuestion(q)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            background: 'rgba(56, 189, 248, 0.1)',
                                            color: '#38bdf8',
                                            border: '1px solid rgba(56, 189, 248, 0.2)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 600
                                        }}
                                        title="Edit"
                                        disabled={!!editingQuestionId && editingQuestionId !== q.id}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuestion(q.id, q.type)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 600
                                        }}
                                        title="Delete"
                                        disabled={!!editingQuestionId}
                                    >
                                        Delete
                                    </button>
                                    <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>

                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.75rem',
                                        background: q.type === 'single' ? 'rgba(56, 189, 248, 0.1)' : q.type === 'multiple' ? 'rgba(168, 85, 247, 0.1)' : q.type === 'diagram' ? 'rgba(34, 197, 94, 0.1)' : q.type === 'cloze' ? 'rgba(244, 114, 182, 0.1)' : q.type === 'matrix' ? 'rgba(251, 146, 60, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                        color: q.type === 'single' ? '#38bdf8' : q.type === 'multiple' ? '#a855f7' : q.type === 'diagram' ? '#22c55e' : q.type === 'cloze' ? '#f472b6' : q.type === 'matrix' ? '#fb923c' : '#6366f1',
                                        borderRadius: '20px',
                                        fontWeight: 600,
                                        border: q.type === 'single' ? '1px solid rgba(56, 189, 248, 0.2)' : q.type === 'multiple' ? '1px solid rgba(168, 85, 247, 0.2)' : q.type === 'diagram' ? '1px solid rgba(34, 197, 94, 0.2)' : q.type === 'cloze' ? '1px solid rgba(244, 114, 182, 0.2)' : q.type === 'matrix' ? '1px solid rgba(251, 146, 60, 0.2)' : '1px solid rgba(99, 102, 241, 0.2)'
                                    }}>
                                        {q.type === 'single' ? 'Single Choice' : q.type === 'multiple' ? 'Multiple Choice' : q.type === 'diagram' ? 'Interactive Flowchart' : q.type === 'cloze' ? 'Fill in Blanks' : q.type === 'matrix' ? 'Matrix Table' : q.type === 'ordering' ? 'Ordering' : 'Input/Calc'}
                                    </span>
                                    {q.exhibits && q.exhibits.length > 0 && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.75rem',
                                            background: 'rgba(14, 165, 233, 0.1)',
                                            color: '#0ea5e9',
                                            borderRadius: '20px',
                                            fontWeight: 600,
                                            border: '1px solid rgba(14, 165, 233, 0.2)'
                                        }}>
                                            {q.exhibits.length === 1 ? '1 Exhibit' : `${q.exhibits.length} Exhibits`}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {q.customId && (
                                            <span style={{
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: '#e2e8f0'
                                            }}>
                                                ID: {q.customId}
                                            </span>
                                        )}
                                        <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
                                            {subjects.find(s => s.id === q.subjectId)?.name}
                                            <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>/</span>
                                            {subjects.find(s => s.id === q.subjectId)?.chapters.find(c => c.id === q.chapterId)?.name}
                                        </span>
                                    </div>
                                </div>

                                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{q.text}</p>

                                {q.type === 'diagram' ? (
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>📊</span>
                                            <div>
                                                <p style={{ fontWeight: 600, color: 'var(--text-accent)' }}>
                                                    {q.diagramType === 'flowchart' ? 'Flowchart' : q.diagramType === 'labeled-diagram' ? 'Labeled Diagram' : 'Process Flow'}
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {q.diagramElements?.length || 0} interactive steps
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : q.type === 'cloze' ? (
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>📝</span>
                                            <div>
                                                <p style={{ fontWeight: 600, color: '#f472b6' }}>
                                                    Fill in the Blanks
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {q.clozeElements?.length || 0} blanks to fill
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : q.type === 'matrix' ? (
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>▦</span>
                                            <div>
                                                <p style={{ fontWeight: 600, color: '#fb923c' }}>
                                                    Matrix Table
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {q.matrixRows?.length || 0} rows, {q.matrixColumns?.length || 0} columns
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : q.type === 'ordering' ? (
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>⇅</span>
                                            <div>
                                                <p style={{ fontWeight: 600, color: '#6366f1' }}>
                                                    Ordering Question
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {q.orderingItems?.length || 0} items to sort
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : q.type === 'input' ? (
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>⌨</span>
                                            <div>
                                                <p style={{ fontWeight: 600, color: '#6366f1' }}>
                                                    Input/Calculation
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    Answer: {q.correctAnswerInput} {q.inputUnit}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : ['sentence_completion', 'drag_drop_priority', 'compare_classify', 'expected_not_expected', 'indicated_not_indicated', 'sata', 'priority_action', 'case_study'].includes(q.type) ? (
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'rgba(99, 102, 241, 0.05)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>🏥</span>
                                            <div>
                                                <p style={{ fontWeight: 600, color: '#818cf8', textTransform: 'capitalize' }}>
                                                    {q.type.replace(/_/g, ' ')}
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    Clinical Reasoning Scenario
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                        {q.options.map((opt, idx) => {
                                            const isCorrect = q.correctOptions.includes(idx);
                                            return (
                                                <div key={idx} style={{
                                                    padding: '0.75rem 1rem',
                                                    background: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                                    border: isCorrect ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    color: isCorrect ? '#4ade80' : 'var(--text-secondary)',
                                                    fontSize: '0.9rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '50%',
                                                        background: isCorrect ? '#4ade80' : 'rgba(255,255,255,0.1)',
                                                        color: isCorrect ? '#0f172a' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </span>
                                                    {opt}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}


                                {q.clientNeeds && (
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        borderRadius: '6px',
                                        borderLeft: '4px solid #22c55e'
                                    }}>
                                        <p style={{ fontWeight: 600, color: '#4ade80', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Client Needs Category:</p>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                            {getClientNeedsLabel(q.clientNeeds)}
                                        </div>
                                    </div>
                                )}

                                {q.exhibits && q.exhibits.length > 0 && (
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        background: 'rgba(14, 165, 233, 0.1)',
                                        borderRadius: '6px',
                                        borderLeft: '4px solid #0ea5e9'
                                    }}>
                                        <p style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Exhibits:</p>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {q.exhibits.map((exhibit, idx) => (
                                                <div key={exhibit.id || idx} style={{
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    padding: '0.75rem',
                                                    borderRadius: '4px'
                                                }}>
                                                    {exhibit.title && (
                                                        <p style={{ fontWeight: 600, color: '#e0f2fe', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                                            {exhibit.title}
                                                        </p>
                                                    )}
                                                    <div
                                                        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}
                                                        dangerouslySetInnerHTML={{
                                                            __html: exhibit.content
                                                                ? exhibit.content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ')
                                                                : ''
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {q.scenario && (
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        background: 'rgba(251, 146, 60, 0.1)',
                                        borderRadius: '6px',
                                        borderLeft: '4px solid #fb923c'
                                    }}>
                                        <p style={{ fontWeight: 600, color: '#fdba74', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Scenario Context:</p>
                                        <div
                                            style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}
                                            dangerouslySetInnerHTML={{
                                                __html: q.scenario
                                                    ? q.scenario.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ')
                                                    : ''
                                            }}
                                        />
                                    </div>
                                )}

                                {q.rationale && (
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        borderRadius: '6px',
                                        borderLeft: '4px solid #6366f1'
                                    }}>
                                        <p style={{ fontWeight: 600, color: '#a5b4fc', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Rationale:</p>
                                        <div
                                            style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                                            dangerouslySetInnerHTML={{
                                                __html: q.rationale
                                                    ? q.rationale.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ')
                                                    : ''
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                </div>

                {/* Pagination Controls */}
                {questions.filter(q => {
                    if (filterSubject && q.subjectId !== filterSubject) return false;
                    if (filterChapter && q.chapterId !== filterChapter) return false;

                    if (!searchQuery) return true;
                    // ... same filter logic as above to get count ...
                    const query = searchQuery.toLowerCase();
                    const subject = subjects.find(s => s.id === q.subjectId);
                    const chapter = subject?.chapters.find(c => c.id === q.chapterId);
                    return (
                        q.id.toLowerCase().includes(query) ||
                        q.customId?.toLowerCase().includes(query) ||
                        q.text.toLowerCase().includes(query) ||
                        (subject && subject.name.toLowerCase().includes(query)) ||
                        (chapter && chapter.name.toLowerCase().includes(query))
                    );
                }).length > itemsPerPage && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                                    color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : 'white',
                                    border: '1px solid var(--border-color)',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Previous
                            </button>
                            <span style={{ color: 'var(--text-secondary)' }}>
                                Page {currentPage} of {Math.ceil(questions.filter(q => {
                                    if (filterSubject && q.subjectId !== filterSubject) return false;
                                    if (filterChapter && q.chapterId !== filterChapter) return false;

                                    if (!searchQuery) return true;
                                    const query = searchQuery.toLowerCase();
                                    const subject = subjects.find(s => s.id === q.subjectId);
                                    const chapter = subject?.chapters.find(c => c.id === q.chapterId);
                                    return (
                                        q.id.toLowerCase().includes(query) ||
                                        q.customId?.toLowerCase().includes(query) ||
                                        q.text.toLowerCase().includes(query) ||
                                        (subject && subject.name.toLowerCase().includes(query)) ||
                                        (chapter && chapter.name.toLowerCase().includes(query))
                                    );
                                }).length / itemsPerPage)}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(questions.filter(q => {
                                    if (filterSubject && q.subjectId !== filterSubject) return false;
                                    if (filterChapter && q.chapterId !== filterChapter) return false;

                                    if (!searchQuery) return true;
                                    const query = searchQuery.toLowerCase();
                                    const subject = subjects.find(s => s.id === q.subjectId);
                                    const chapter = subject?.chapters.find(c => c.id === q.chapterId);
                                    return (
                                        q.id.toLowerCase().includes(query) ||
                                        q.customId?.toLowerCase().includes(query) ||
                                        q.text.toLowerCase().includes(query) ||
                                        (subject && subject.name.toLowerCase().includes(query)) ||
                                        (chapter && chapter.name.toLowerCase().includes(query))
                                    );
                                }).length / itemsPerPage)))}
                                disabled={currentPage >= Math.ceil(questions.filter(q => {
                                    if (filterSubject && q.subjectId !== filterSubject) return false;
                                    if (filterChapter && q.chapterId !== filterChapter) return false;

                                    if (!searchQuery) return true;
                                    const query = searchQuery.toLowerCase();
                                    const subject = subjects.find(s => s.id === q.subjectId);
                                    const chapter = subject?.chapters.find(c => c.id === q.chapterId);
                                    return (
                                        q.id.toLowerCase().includes(query) ||
                                        q.customId?.toLowerCase().includes(query) ||
                                        q.text.toLowerCase().includes(query) ||
                                        (subject && subject.name.toLowerCase().includes(query)) ||
                                        (chapter && chapter.name.toLowerCase().includes(query))
                                    );
                                }).length / itemsPerPage)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    background: currentPage >= Math.ceil(questions.filter(q => {
                                        if (filterSubject && q.subjectId !== filterSubject) return false;
                                        if (filterChapter && q.chapterId !== filterChapter) return false;

                                        if (!searchQuery) return true;
                                        const query = searchQuery.toLowerCase();
                                        const subject = subjects.find(s => s.id === q.subjectId);
                                        const chapter = subject?.chapters.find(c => c.id === q.chapterId);
                                        return (
                                            q.id.toLowerCase().includes(query) ||
                                            q.customId?.toLowerCase().includes(query) ||
                                            q.text.toLowerCase().includes(query) ||
                                            (subject && subject.name.toLowerCase().includes(query)) ||
                                            (chapter && chapter.name.toLowerCase().includes(query))
                                        );
                                    }).length / itemsPerPage) ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                                    color: currentPage >= Math.ceil(questions.filter(q => {
                                        if (filterSubject && q.subjectId !== filterSubject) return false;
                                        if (filterChapter && q.chapterId !== filterChapter) return false;

                                        if (!searchQuery) return true;
                                        const query = searchQuery.toLowerCase();
                                        const subject = subjects.find(s => s.id === q.subjectId);
                                        const chapter = subject?.chapters.find(c => c.id === q.chapterId);
                                        return (
                                            q.id.toLowerCase().includes(query) ||
                                            q.customId?.toLowerCase().includes(query) ||
                                            q.text.toLowerCase().includes(query) ||
                                            (subject && subject.name.toLowerCase().includes(query)) ||
                                            (chapter && chapter.name.toLowerCase().includes(query))
                                        );
                                    }).length / itemsPerPage) ? 'rgba(255,255,255,0.3)' : 'white',
                                    border: '1px solid var(--border-color)',
                                    cursor: currentPage >= Math.ceil(questions.filter(q => {
                                        if (filterSubject && q.subjectId !== filterSubject) return false;
                                        if (filterChapter && q.chapterId !== filterChapter) return false;

                                        if (!searchQuery) return true;
                                        const query = searchQuery.toLowerCase();
                                        const subject = subjects.find(s => s.id === q.subjectId);
                                        const chapter = subject?.chapters.find(c => c.id === q.chapterId);
                                        return (
                                            q.id.toLowerCase().includes(query) ||
                                            q.customId?.toLowerCase().includes(query) ||
                                            q.text.toLowerCase().includes(query) ||
                                            (subject && subject.name.toLowerCase().includes(query)) ||
                                            (chapter && chapter.name.toLowerCase().includes(query))
                                        );
                                    }).length / itemsPerPage) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
            </div>
        </div >
    );
}
