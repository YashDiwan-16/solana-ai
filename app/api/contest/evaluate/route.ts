import { NextResponse } from 'next/server';
import { ScoringService } from '@/services/scoringService';
import clientPromise from '@/lib/clientpromise';
// import { TweetData } from '@/lib/contest';

export async function POST(request: Request) {
  try {
    const { tweetData, taskId } = await request.json();
    
    // Validate tweet data
    if (!tweetData || !taskId) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Get task details
    const client = await clientPromise;
    const db = client.db('tweetcontest');
    const task = await db.collection('tasks').findOne({ _id: taskId });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if task is still active
    if (!task.isActive) {
      return NextResponse.json(
        { error: 'Task has ended' },
        { status: 400 }
      );
    }

    // Evaluate entry
    const entry = await ScoringService.evaluateEntry(tweetData, taskId);

    // Check if task should end
    const now = new Date();
    if (now >= new Date(task.endTime)) {
      await ScoringService.determineWinners(taskId);
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error evaluating contest entry:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate entry' },
      { status: 500 }
    );
  }
}