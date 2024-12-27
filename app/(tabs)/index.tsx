import React, { useCallback } from "react";
import { useState } from "react";
import {
  StyleProp,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import uuid from "react-native-uuid";

type CommentType = {
  _id: string;
  commentText: string;
  canReply: boolean;
  isReplying: boolean;
  subComments: CommentType[];
  isCollapsed: boolean;
};

const DATA: CommentType[] = [
  {
    _id: "1",
    commentText: "Hello",
    canReply: true,
    isReplying: false,
    subComments: [],
    isCollapsed: false,
  },
];

const provideNewCommentsToMakeReplyVisible = (
  comments: CommentType[],
  comment: CommentType
): CommentType[] => {
  if (comments.length > 0) {
    return comments.map((_comment: CommentType) => {
      if (_comment._id === comment._id) {
        return {
          ..._comment,
          isReplying: !comment.isReplying,
        };
      } else if (_comment.subComments.length > 0) {
        return {
          ..._comment,
          subComments: provideNewCommentsToMakeReplyVisible(
            _comment.subComments,
            comment
          ),
        };
      } else {
        return { ..._comment, isReplying: false };
      }
    });
  }

  return [];
};

const provideNewCommentsByCollapseSubComments = (
  comments: CommentType[],
  comment: CommentType
): CommentType[] => {
  if (comments.length > 0) {
    return comments.map((_comment: CommentType) => {
      if (_comment._id === comment._id) {
        return {
          ..._comment,
          isCollapsed: !comment.isCollapsed,
        };
      } else if (_comment.subComments.length > 0) {
        return {
          ..._comment,
          subComments: provideNewCommentsByCollapseSubComments(
            _comment.subComments,
            comment
          ),
        };
      } else {
        return { ..._comment, isCollapsed: false };
      }
    });
  }

  return [];
};

const provideNewCommentsByAddingComment = (
  comments: CommentType[],
  comment: CommentType,
  commentText: string
): CommentType[] => {
  if (comments.length > 0) {
    return comments.map((_comment: CommentType) => {
      if (_comment._id === comment._id) {
        // First Level
        const newCommentObj: CommentType = {
          _id: uuid.v4(),
          canReply: true,
          commentText,
          isReplying: false,
          subComments: [],
          isCollapsed: false,
        };
        const subComments = _comment.subComments;
        subComments.push(newCommentObj);
        return {
          ..._comment,
          isReplying: false,
          subComments,
        };
      } else if (_comment.subComments.length > 0) {
        // Nested SubComments
        return {
          ..._comment,
          isReplying: false,
          subComments: provideNewCommentsByAddingComment(
            _comment.subComments,
            comment,
            commentText
          ),
        };
      } else {
        return { ..._comment, isReplying: false };
      }
    });
  }

  return [];
};

export default function HomeScreen() {
  const [comments, setComments] = useState<CommentType[]>(DATA);

  const handleReply = useCallback(
    (comment: CommentType) => () => {
      setComments(provideNewCommentsToMakeReplyVisible(comments, comment));
    },
    [comments]
  );

  const handleReplySubmit = useCallback(
    (commentText: string, comment: CommentType) => () => {
      commentText &&
        setComments(
          provideNewCommentsByAddingComment(comments, comment, commentText)
        );
    },
    [comments]
  );

  const handleCancelComment = useCallback(
    (comment: CommentType) => () => {
      setComments(provideNewCommentsToMakeReplyVisible(comments, comment));
    },
    [comments]
  );

  const handleCollapseSubComments = useCallback(
    (comment: CommentType) => () => {
      setComments(provideNewCommentsByCollapseSubComments(comments, comment));
    },
    []
  );

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.commentListContentContainer}
        renderItem={({ item: comment }) => (
          <Comment
            key={comment._id}
            comment={comment}
            onReply={handleReply}
            onReplySubmit={handleReplySubmit}
            onCancelComment={handleCancelComment}
            onCollapse={handleCollapseSubComments}
          />
        )}
      />
    </SafeAreaView>
  );
}

type CommentProps = {
  onReply: (comment: CommentType) => () => void;
  comment: CommentType;
  onReplySubmit: (commentText: string, comment: CommentType) => () => void;
  style?: StyleProp<ViewStyle>;
  onCancelComment: (comment: CommentType) => () => void;
  onCollapse: (comment: CommentType) => () => void;
};

function Comment({
  comment,
  onReply,
  onReplySubmit,
  style,
  onCancelComment,
  onCollapse,
}: CommentProps) {
  const { canReply, commentText, subComments, isReplying, isCollapsed } =
    comment;
  const [typedCommnentText, setTypedCommentText] = useState<string>("");

  const handleOnCommentTyping = useCallback(
    (text: string) => setTypedCommentText(text),
    []
  );

  const handleReply = useCallback(() => {
    setTypedCommentText("");
    onReply(comment)();
  }, [comment, onReply]);

  return (
    <View style={[styles.commentContainer, style]}>
      <Text style={styles.commentText}>{commentText}</Text>
      {canReply && !isReplying ? (
        <View style={styles.flexWrap}>
          <TouchableOpacity style={styles.replyButton} onPress={handleReply}>
            <Text style={styles.buttonText}>Reply</Text>
          </TouchableOpacity>
          {subComments.length > 0 ? (
            <TouchableOpacity
              style={[
                styles.replyButton,
                {
                  marginStart: 8,
                },
              ]}
              onPress={onCollapse(comment)}
            >
              <Text style={styles.buttonText}>
                {isCollapsed ? "Expand" : "Collapse"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {isReplying ? (
        <View>
          <TextInput
            value={typedCommnentText}
            onChangeText={handleOnCommentTyping}
            style={styles.textInput}
            placeholder="Type comment here...."
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onReplySubmit(typedCommnentText, comment)}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancelComment(comment)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {subComments.length > 0 && !isCollapsed ? (
        <FlatList
          data={subComments}
          style={styles.subCommentsList}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: subComment }) => (
            <Comment
              key={subComment._id}
              comment={subComment}
              onReply={onReply}
              onReplySubmit={onReplySubmit}
              onCancelComment={onCancelComment}
              onCollapse={onCollapse}
              style={styles.subCommentsList}
            />
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentContainer: {
    borderWidth: 1,
    padding: 4,
  },
  commentText: {
    fontSize: 16,
    fontWeight: "700",
  },
  flexWrap: {
    flexWrap: "wrap",
    flexDirection: "row",
  },
  replyButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "black",
    marginTop: 8,
    padding: 4,
    color: "black",
  },
  buttonContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
  },
  actionButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  cancelButton: {
    marginStart: 8,
  },
  subComment: {
    marginStart: 4,
    marginTop: 8,
  },
  subCommentsList: { marginTop: 4 },
  commentListContentContainer: {
    paddingBottom: 100,
  },
});
